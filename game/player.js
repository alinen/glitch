
class Player extends MovingObject
{
   constructor() 
   {
      super();
      this.starCount = 0;
      this.orbCount = 0;
      this.spawnCount = 0;
   }

   init()
   {
      this.health = gameState.health;
   }

   placeInHex(hexIdx)
   {
      super.placeInHex(hexIdx);
      this.scale.s = hexBoard.b * 0.25;
      this.translate.z = -4.0;
      this.speed = 0.0075;
   }

   update(dt)
   {
      super.update(dt);

      if (Math.abs(this.dir.y) > 0.0 || Math.abs(this.dir.x) > 0.0)
      {
         this.rotate.r = Math.atan2(-this.dir.x, this.dir.y);
      }
   }

   _reachedTarget(idx)
   {
      hexBoard.showHexById(idx, 1.0);
   }

   previewDir(worldPoint)
   {
      if (this.targetHex !== -1) return; // already going somewhere

      var hexCenter = hexBoard.getHexCenterById(this.currentHex);
      var dirx = worldPoint.x - hexCenter.x;
      var diry = worldPoint.y - hexCenter.y;
      var len = Math.sqrt(dirx*dirx + diry*diry);
      if (len < hexBoard.r) return; // inside our cell

      var ndirx = dirx/len;
      var ndiry = diry/len;

      var minAngle = Math.PI*4;
      var mini = -1;
      for (var i = 0; i < NEIGHBORS.length; i++)
      {
         var angle = Math.acos(ndirx * NEIGHBORS[i].dir.x + ndiry * NEIGHBORS[i].dir.y);
         if (angle < minAngle)
         {
            mini = i;
            minAngle = angle;
         }
      }

      if (mini !== -1) 
      {
          this.rotate.r = Math.atan2(-NEIGHBORS[mini].dir.x, NEIGHBORS[mini].dir.y);
          this.attemptMove(NEIGHBORS[mini]);
      }
   }

   /*
   function pickup(type)
   {
      if (type === CAVE.STAR)
      {
         this.starCount++;
         this.activateStar();
      }
      else if (type === CAVE.ORB)
      {
         this.orbCount++;
      } 
      else if (type === CAVE.SPAWN)
      {
         this.spawnCount++;
      }
   }

   function activateOrb()
   {
      if (this.orbCount > 0)
      {
         this.orbCount--;
         return true;
      }
   }

   function activateStar()
   {
      this.starTime = gameState.starDuration;
   }
   */
}
   
