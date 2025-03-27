#!/bin/bash
KEYVAULT_NAME=$(az keyvault list --resource-group "rg-$AZURE_ENV_NAME" --query "[0].name" -o tsv)

if [ -z "$KEYVAULT_NAME" ]; then
    echo "Error: No Key Vault found in resource group rg-$AZURE_ENV_NAME"
    # exit 1
fi

echo "Using Key Vault: $KEYVAULT_NAME"

echo "Retrieving MongoDB connection string from Azure Key Vault..."
TARGET_URL=$(az keyvault secret show --name mongodb-url --vault-name $KEYVAULT_NAME --query value -o tsv)

if [ -z "$TARGET_URL" ]; then
    echo "Error: Failed to retrieve MongoDB connection string from Azure Key Vault"
    # exit 1
fi

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo "Error: mongosh is not installed. Please install MongoDB Shell first."
    # exit 1
fi

# Check if copyDb.js exists
if [ ! -f "./infra/scripts/copyDb.js" ]; then
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

# Execute the copyDb.js script using mongosh with the connection string
echo "Executing database seeding script..."
mongosh "$TARGET_URL" --quiet --file ./infra/scripts/copyDb.js

# # Check if the command was successful
# if [ $? -eq 0 ]; then
#     echo "Database seeding completed successfully."
# else
#     echo "Error: Database seeding failed."
#     exit 1
# fi