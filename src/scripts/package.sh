#! /bin/bash
# This script creates a zip package to be deployed to uberspace
# Copy the app to uberspace in the home directory and run updateapp.sh

OLDDIR=$(pwd)
cd $(dirname "$0")
cd ..
if [[ "$1" == "rebuild" ]]; then
  echo "Cleaning up..."
  if [ -d "backend/dist" ]; then
    echo "Deleting old dist folder..."
    rm -rf backend/dist
  fi
  echo "Building client..."
  cd client
  npm run --silent build &>/dev/null
  cd ..
  echo "Building ui..."
  cd ui
  npm run --silent build &>/dev/null
  cd ..
fi
echo "Running backend build..."
cd backend
npm run --silent build
cd ..
if [ -d "package" ]; then
  echo "Deleting an old package folder..."
  rm -rf package
fi
echo "Creating folders..."
mkdir package
mkdir package/dist
echo "Copying build output..."
cp -r backend/dist/* package/dist
cp backend/package.json package
cd package
echo "Installing necessary npm modules..."
npm install --omit=dev &>/dev/null
cd ..

if [ -f "app.zip" ]; then
  echo "Deleting old app.zip..."
  rm -f app.zip
fi
echo "Creating app.zip..."
cd package
zip -r ../app.zip * &>/dev/null
cd ..
echo "Clean up.."
if [ -d "package" ]; then
 rm -rf package
fi
cd $OLDDIR
