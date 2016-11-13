class NPC extends MovingObject
{
   constructor(respawnTime)
   {
      super();
      this.spawnIdx = -1;
      this.respawnTime = respawnTime;
      this.enabled = false;
      this.scale = 0.4;
      this.timer = -1;
      this.isNPC = true;
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
      this.respawnTime = 999999999.0;
   }
}

class Item extends NPC
{
   constructor(type, respawnTime)
   {
      super(respawnTime);
      this.type = type;
   }
   
   reactTo(player)
   {
      if (this.enabled)
      {
         this.enabled = false;
         this.timer = this.respawnTime;
      }
      else if (this.timer < 0)
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
   constructor(type, respawnTime)
   {
      super(type, respawnTime);
      this.scale = 10.0;
      this.speed = 0.0005;
      this.targetDist = 0;
      this.startpos = {x:0,y:0};
      this.translate.z = -5.0;
   }
   
   start(startpos, startrot, vel)
   {
      this.dir = vel;
      this.startpos = startpos;
      this.pos.x = startpos.x;
      this.pos.y = startpos.y;
      this.rotate = startrot;
      this.enabled = true;
      this.startpos = startpos;
   }

   update(dt)
   {
      super.update(dt);

      if (this.enabled)
      {
        // console.log(this.translate.x+" "+this.translate.y+" "+this.dir.y+" "+this.pos.y);
         if ((this.startpos.y < 0 && this.pos.y > -10) ||
             (this.startpos.y > 0 && this.pos.y < 10))
         {
            this.dir.x = 0;
            this.dir.y = 0;
         }
      }
   }
}

class Spawn extends NPC
{
   constructor(type, respawnTime)
   {
      super(type, respawnTime);
      this.speed = 0.001;
      this.scale = 0.35;      
   }

   reactTo(player)
   {
      if (this.enabled)
      {
         this.enabled = false;
         this.timer = this.respawnTime;
      }
      else if (this.timer < 0)
      {
         super.reactTo(player);
         this.timer = 2;
      }      
   }   

   _reachedTarget(idx)
   {
      this.timer = 10; 
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
            var path = hexBoard.computePath(this.currentHex, nextHex);
            this.followPath(path);
         }
      }
   }
};
