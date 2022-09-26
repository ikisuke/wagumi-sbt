#/bin/zsh

while true; do
    read -p "Nodeをインストールしますか? [y = はい, n = いいえ]" yn
    case $yn in
        [y] ) make install; break;;
        [n] ) echo "プログラムを終了します"; exit;;
        * ) echo "Please answer yes or no.";;
    esac
done