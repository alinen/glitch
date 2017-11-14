class NPC extends MovingObject
{
   constructor(type, respawnTime)
   {
      super();
      this.spawnIdx = -1;
      this.enabled = false;
      this.scale = 0.25;
      this.timer = -1;
      this.isNPC = true;
      this.type = type;
   }

   placeInHex(idx)
   {
      super.placeInHex(idx);
      this.spawnIdx = idx;
   }

   update(dt)
   {
      super.update(dt);
   }

   reactTo(player)
   {
      this.enabled = true;
   }

   kill() // no more respawns, not for a long long time
   {
      this.enabled = false;
   }
}

class Item extends NPC
{
   constructor(type, respawnTime)
   {
      super(type);
      this.respawnTime = respawnTime
   }
   
   reactTo(player)
   {
      if (this.enabled)
      {
         this.enabled = false;
         this.timer = this.respawnTime;
      }
      else if (this.timer < 0) // first contact
      {
         super.reactTo(player);
      }
   }

   update(dt)
   {
      super.update(dt);
      if (this.timer > 0)
      {
         this.timer -= dt * 0.001;
         if (this.timer < 0)
         {
            this.enabled = true;
         }
      }
   }
}

class Teeth extends NPC
{
   constructor(type)
   {
      super(type);
      this.scale = 1.0;
      this.speed = 0.0005;
      this.targetDist = 0;
      this.startpos = {x:worldSize*2,y:0};
   }
   
   start(startpos, startrot, vel)
   {
      this.dir = vel;
      this.startpos = startpos;
      this.pos.x = startpos.x;
      this.pos.y = startpos.y;
      this.rotate = startrot;
      this.scale = worldSize;
      this.translate.x = startpos.x;
      this.translate.y = startpos.y;
      this.translate.z = -5.0;
      this.enabled = true;
   }

   update(dt)
   {
      super.update(dt);

      if (this.enabled)
      {
        // console.log(this.translate.x+" "+this.translate.y+" "+this.dir.y+" "+this.pos.y);
         if ((this.startpos.y < 0 && this.pos.y > -worldSize) ||
             (this.startpos.y > 0 && this.pos.y < worldSize))
         {
            this.dir.x = 0;
            this.dir.y = 0;
         }
      }
   }
}

class Spawn extends NPC
{
   constructor(type)
   {
      super(type);
      this.speed = 0.001;
   }

   _reachedTarget(idx)
   {
      this.timer = 10; 
      hexBoard.setHexType(idx,this.type);
   }   

   update(dt)
   {
      super.update(dt);
      if (this.enabled)
      {
         this.timer -= dt * 0.001;
         if (!this.isMoving() && this.timer < 0)
         {         
            var nextHex = Math.floor(Math.random() *  hexBoard.numHex);
            var path = hexBoard.computePath(this.currentHex, nextHex, false, false);
            this.followPath(path);
         }
      }
   }
};
