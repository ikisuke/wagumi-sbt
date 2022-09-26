 #!/bin/zsh
 cd  `dirname $0`


  if type "node" > /dev/null 2>&1; then
      echo "exist!"     
  else
      while true; do
    read -p "Nodeをインストールしますか? [y = はい, n = いいえ]" yn
    case $yn in
        [y] ) curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"; break;;
        [n] ) echo "プログラムを終了します"; exit;;
        * ) echo "Please answer yes or no.";;
    esac
done
  fi


 npm i

 echo "------------------------"
 echo  "メタデータの作成(update)を開始します"
 node main.js update
 echo "------------------------"
 echo "コミットを開始します"
 git add .
 git commit -m "update metadata"
 echo "------------------------"
 echo プッシュを開始します
 git push origin main
 echo "------------------------"
 echo "Githubのサイトからプルリクエストを出してください"
 echo "------------------------"
