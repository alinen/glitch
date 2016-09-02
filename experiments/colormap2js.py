import sys

def printMapArray(colormap, name):
    print "\nvar %s = ["%name
    for i in range(len(colormap)-1):
        r,g,b = colormap[i]
        print "\t%s, %s, %s,"%(r,g,b)
    r,g,b = colormap[-1]
    print "\t%s, %s, %s"%(r,g,b)
    print "];"

f = open('colormaps.txt', 'r')
maps = []
colormap = []
for line in f.readlines():
   if line.strip() == "":
      printMapArray(colormap, maps[-1])
      colormap = []
      continue

   tokens = line.split()
   if len(tokens) == 3:
      colormap.append((tokens[0], tokens[1], tokens[2]))
   else:
      maps.append(line.strip())


print "colormaps = new Map();"
for name in maps:
   print "colormaps.set(\"%s\", %s);"%(name, name)
f.close()

