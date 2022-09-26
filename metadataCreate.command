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

 node main.js
