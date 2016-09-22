class NPC extends MovingObject
{
   constructor(type, respawnTime)
   {
      super();

      this.type = type;
      this.spawnIdx = -1;
      this.respawnTime = respawnTime;
      this.active = false;
      this.scale.s = 0.4;
      this.timer = -1;
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
      this.active = true;
   }
}

class Item extends NPC
{
   constructor(type, respawnTime)
   {
      super(type, respawnTime);
   }
   
   reactTo(player)
   {
      if (this.active)
      {
         this.active = false;
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
            this.active = true;
         }
      }
   }
}

class Teeth extends NPC
{
   constructor(type, respawnTime)
   {
      super(type, respawnTime);
      this.scale.s = 10.0;
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
      this.rotate.r = startrot;
      this.active = true;
      this.startpos = startpos;
   }

   update(dt)
   {
      super.update(dt);

      if (this.active)
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
      this.scale.s = 0.35;      
   }

   reactTo(player)
   {
      if (this.active)
      {
         //this.active = false;
         //this.timer = this.respawnTime;
      }
      else if (this.timer < 0)
      {
         super.reactTo(player);
         this.timer = 2;
      }      
   }   

   update(dt)
   {
      super.update(dt);
      this.timer -= dt * 0.001;
      if (!this.isMoving() && this.active && this.timer < 0)
      {
         var moves = hexBoard.getMoves(this.currentHex);
         var diceRoll = Math.floor(Math.random() * moves.length);
         var next = moves[diceRoll];         
         this.attemptMove(next);
      }
   }
};
