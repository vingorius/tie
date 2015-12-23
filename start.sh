export NODE_ENV=production
# Forever As Superuser
PORT=4000 forever start --minUptime 1000 --spinSleepTime 1000 -l ../forever.log -o ../out.log -e ../err.log --append  bin/www;

forever list;
