
class Player extends MovingObject
{
   constructor() 
   {
      super();
   }

   update(dt)
   {
      super.update(dt);

      if (Math.abs(this.dir.y) > 0.0 || Math.abs(this.dir.x) > 0.0)
      {
         this.rotate.r = Math.atan2(-this.dir.x, this.dir.y) / DEG2RAD;
      }
   }

   _reachedTarget(idx)
   {
      hexBoard.showHexById(idx, 1.0);
   }
}
   
