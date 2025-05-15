#!/bin/bash

# Set environment
export NODE_ENV=development

# Parse command line arguments
CLEAN_START=false
REMOVE_CONTAINERS=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --clean) CLEAN_START=true ;;
        --remove) REMOVE_CONTAINERS=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# If remove flag is set, just remove containers and exit
if [ "$REMOVE_CONTAINERS" = true ]; then
    echo "Stopping and removing containers..."
    docker-compose down -v
    exit 0
fi

# Start Docker services
echo "Starting Docker services..."
if [ "$CLEAN_START" = true ]; then
    echo "Performing clean start (removing all data)..."
    docker-compose down -v
else
    echo "Performing soft restart (preserving data)..."
    docker-compose down
fi
docker-compose up -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until docker exec mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    sleep 2
done

# Initialize replica set if not already initialized
echo "Initializing MongoDB replica set..."
docker exec mongodb mongosh --eval '
    try {
        if (!rs.status().ok) {
            rs.initiate({
                _id: "rs1",
                members: [{ _id: 0, host: "mongodb:27017" }]
            });
        }
    } catch (e) {
        rs.initiate({
            _id: "rs1",
            members: [{ _id: 0, host: "mongodb:27017" }]
        });
    }
    // Wait for replica set to be ready
    let attempts = 30;
    while (attempts > 0) {
        try {
            let status = rs.status();
            if (status.ok && status.members[0].state === 1) {
                print("Replica set is ready!");
                break;
            }
        } catch (e) {}
        sleep(1000);
        attempts--;
    }
'

# Start the application
echo "Starting the application..."
npm run dev:server
