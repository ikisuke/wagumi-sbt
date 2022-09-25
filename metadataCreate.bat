@echo off
cd  %%~dp0: %~dp0

  if type "node" > nul 2>&1 (
	echo "exist!"  
  ) else (
      echo "nodeがインストールできていないようです。以下のリンクからインストールしてください \n https://nodejs.org/ja/ "
  )

npm i

node main.js
