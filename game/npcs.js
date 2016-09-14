class NPC extends MovingObject
{
   constructor(respawnTime)
   {
      super();

      this.spawnIdx = -1;
      this.respawnTime = respawnTime;
      this.active = false;
      this.scale.s = 0.4;
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

   playerEvent(player)
   {
      this.active = true;
   }
}
