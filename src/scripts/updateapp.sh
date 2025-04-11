#! /bin/bash
# This script is used to update the app on Uberspace
# It is designed to be run from the command line located in the uberspaces users home directory

cd ~

if [ ! -f app.zip ]; then
    echo "No zip archive to install found. Please upload app.zip to the server."
    exit 0
fi

# First we stop the service
echo "Stopping the service..."
supervisorctl stop app-service

# Delete the old app from the folder
echo "Deleting old app..."
if [ -d app ]; then
    echo "Deleting old app folder..."
    rm -rf app
fi

echo "Unzipping new app..."
unzip app.zip -d app &>/dev/null
echo "Starting the service again"
supervisorctl start app-service
echo "Cleaning up..."
rm -rf app.zip
echo "Done! The app has been updated."


