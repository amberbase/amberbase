#! /bin/bash
# This script creates a zip package to be deployed to uberspace
# Copy the app to uberspace in the home directory and run updateapp.sh

OLDDIR=$(pwd)
echo "Running build..."
./package.sh rebuild

echo "Copying app.zip to uberspace..."
cd ..
scp -P 22 app.zip amber@elnath.uberspace.de:/home/amber/app.zip
echo "Running updateapp.sh on uberspace..."
ssh amber@elnath.uberspace.de '/home/amber/updateapp.sh'
echo "Cleaning up..."
if [ -f "app.zip" ]; then
  rm -f app.zip
fi
cd $OLDDIR
