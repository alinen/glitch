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
      /*if (!this.isMoving() || this.targetHex === -1)
      {
         var moves = hexBoard.getMoves(this.currentHex);
         var diceRoll = Math.floor(Math.random() * moves.length);
         var next = moves[diceRoll];
         this.attemptMove(next);
      }*/

      super.update(dt);
   }

   reactTo(player)
   {
      this.active = true;
   }
}

class Heart extends NPC
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

