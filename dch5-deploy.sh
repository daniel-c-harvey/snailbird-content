npm run build
mkdir deploy
cd ./deploy
mkdir bin && mkdir ./bin/src
cp -r ../bin/src/* ./bin/src
cp  ../package.json ../package-lock.json ./
scp -i ~/.ssh/dch5snailbirdRSA -r ./ snailbird@dch5.snailbird.net:/snailbird/content
rm -rf ../deploy
