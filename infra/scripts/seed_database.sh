#!/bin/bash

# Usage information
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Database Seeding Script"
    echo "======================"
    echo ""
    echo "Usage:"
    echo "  $0                    # Seed Azure/Production database (requires AZURE_ENV_NAME)"
    echo "  $0 --local           # Seed local MongoDB with development data"
    echo "  $0 --help            # Show this help message"
    echo ""
    echo "Local mode (--local):"
    echo "  - Seeds ONLY the local MongoDB with playground/development data"
    echo "  - Uses files: playground-1.mongodb.js, playground-2.mongodb.js, seedData.js"
    echo "  - Does NOT execute cloud database seeding (copyDb.js)"
    echo "  - Requires: MongoDB running on localhost:27017 with replica set 'rs0'"
    echo "  - Start with: docker compose up mongodb -d"
    echo ""
    echo "Azure mode (default):"
    echo "  - Seeds cloud database by copying data using copyDb.js"
    echo "  - Requires: AZURE_ENV_NAME environment variable set"
    echo "  - Requires: Azure CLI logged in (az login)"
    echo "  - Requires: Access to Azure Key Vault with mongodb-url secret"
    echo ""
    exit 0
fi

# Check for --local flag for development seeding
LOCAL_MODE=false
if [[ "$1" == "--local" ]]; then
    LOCAL_MODE=true
    echo "Running in LOCAL development mode"
    echo "================================="
fi

if [ "$LOCAL_MODE" = true ]; then
    # Local development mode - use local MongoDB
    TARGET_URL="mongodb://localhost:27017/?replicaSet=rs0"
    echo "Using local MongoDB: $TARGET_URL"
    
    # Check if local MongoDB is running
    echo "Checking if local MongoDB is running..."
    if ! mongosh "$TARGET_URL" --eval "db.runCommand('hello')" --quiet > /dev/null 2>&1; then
        echo "Error: Cannot connect to local MongoDB"
        echo "Please ensure MongoDB is running: docker compose up mongodb -d"
        exit 1
    fi
    echo "✓ Local MongoDB connection successful"
else
    # Azure/Production mode - use Key Vault
    echo "Running in AZURE/PRODUCTION mode"
    
    KEYVAULT_NAME=$(az keyvault list --resource-group "rg-$AZURE_ENV_NAME" --query "[0].name" -o tsv)

    if [ -z "$KEYVAULT_NAME" ]; then
        echo "Error: No Key Vault found in resource group rg-$AZURE_ENV_NAME"
        echo "Hint: Run with --local flag for local development"
        # exit 1
    fi

    echo "Using Key Vault: $KEYVAULT_NAME"

    echo "Retrieving MongoDB connection string from Azure Key Vault..."
    TARGET_URL=$(az keyvault secret show --name mongodb-url --vault-name $KEYVAULT_NAME --query value -o tsv)

    if [ -z "$TARGET_URL" ]; then
        echo "Error: Failed to retrieve MongoDB connection string from Azure Key Vault"
        echo "Hint: Run with --local flag for local development"
        # exit 1
    fi
fi

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo "Error: mongosh is not installed. Please install MongoDB Shell first."
    # exit 1
fi

# Check if copyDb.js exists (only needed for Azure mode)
if [ "$LOCAL_MODE" = false ] && [ ! -f "./infra/scripts/copyDb.js" ]; then
    echo "Error: copyDb.js script not found in current directory."
    # exit 1
fi

echo "Starting database seeding process..."
echo "Target database: $TARGET_URL"

# Check if we're in the right directory, if not go to project root
if [[ ! -d "./infra/scripts" ]]; then
    cd /home/saitcho/webmud
    if [[ ! -d "./infra/scripts" ]]; then
        echo "Error: Could not find project directory structure"
        # exit 1
    fi
fi

# Debug: Print the target URL (with masked password for security)
MASKED_URL=$(echo "$TARGET_URL" | sed -E 's/\/\/([^:]+):([^@]+)@/\/\/\1:***@/')
echo "Connection string (masked): $MASKED_URL"

if [ "$LOCAL_MODE" = true ]; then
    # Local development mode - only seed local development data
    echo ""
    echo "Seeding local development data..."
    
    # Check if playground data files exist
    if [ -f "./game-data/world-assets/playground-1.mongodb.js" ]; then
        echo "Seeding playground-1 data..."
        mongosh "$TARGET_URL" --quiet --file ./game-data/world-assets/playground-1.mongodb.js
    else
        echo "Warning: playground-1.mongodb.js not found"
    fi
    
    if [ -f "./game-data/world-assets/playground-2.mongodb.js" ]; then
        echo "Seeding playground-2 data..."
        mongosh "$TARGET_URL" --quiet --file ./game-data/world-assets/playground-2.mongodb.js
    else
        echo "Warning: playground-2.mongodb.js not found"
    fi
    
    if [ -f "./game-data/world-assets/seedData.js" ]; then
        echo "Seeding additional world data..."
        mongosh "$TARGET_URL" --quiet --file ./game-data/world-assets/seedData.js
    else
        echo "Warning: seedData.js not found"
    fi
    
    echo "Local development seeding completed!"
else
    # Azure/Production mode - execute cloud database seeding
    echo "Executing cloud database seeding script..."
    mongosh "$TARGET_URL" --quiet --file ./infra/scripts/copyDb.js
fi

# # Check if the command was successful
# if [ $? -eq 0 ]; then
#     echo "Database seeding completed successfully."
# else
#     echo "Error: Database seeding failed."
#     exit 1
# fi