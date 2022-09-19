 #!/bin/zsh
 cd  `dirname $0`


  if type "node" > /dev/null 2>&1; then
      echo "exist!"     
  else
      echo "nodeがインストールできていないようです。以下のリンクからインストールしてください \n https://nodejs.org/ja/ "
  fi


 npm i

 node main.js
