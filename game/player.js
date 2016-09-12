
class Player extends MovingObject
{
   constructor() 
   {
      super();
   }

   placeInHex(hexIdx)
   {
      super.placeInHex(hexIdx);
      this.scale.s = hexBoard.b * 0.25;
      this.translate.z = -4.0;
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
   
