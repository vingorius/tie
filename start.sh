#DEBUG=ohinsook:* npm start
#DEBUG=ohinsook:* nodemon bin/www


export NODE_ENV=production
# Forever As Superuser
PORT=4000 forever start  --minUptime 1000 --spinSleepTime 1000 \
               --uid "vingorius" -l "/tmp/tie.log" --append \
               -c "nodemon" \
               bin/www

