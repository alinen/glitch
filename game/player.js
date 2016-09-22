
class Player extends MovingObject
{
   constructor() 
   {
      super();
      this.arrowCount = 1;
      this.isDead = false;
      this.health = 0;
   }

   init()
   {
      this.health = gameState.health;
      this.isDead = false;
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
      if (this.isDead) return; // can't move

      super.update(dt);

      if (Math.abs(this.dir.y) > 0.0 || Math.abs(this.dir.x) > 0.0)
      {
         this.rotate.r = Math.atan2(-this.dir.x, this.dir.y);
      }
   }

   _reachedTarget(idx)
   {
      hexBoard.showHexById(idx, 1.0);
      var type = hexBoard.getHexType(idx);
      if (type === CAVE.BEAST)
      {
         this.health = 0;
         this.isDead = true;
         console.log("DIE");
      }      
      else
      {
         var npc = lookupNPC(idx);
         if (npc && npc.active)
         {
            if (npc.type == CAVE.SPAWN)
            {
               this.health -= gameState.spawnDamage;
            }
            else if (npc.type == CAVE.HEART)
            {
               this.health = gameState.health; // reset health
            }

         }
         if (npc) npc.reactTo(this);         
      }
 
   }

   previewDir(worldPoint)
   {
      if (this.targetHex !== -1) return; // already going somewhere

      var hexIdx = hexBoard.pointToId(worldPoint);
      if (!hexBoard.isNeighbor(this.currentHex, hexIdx)) return; // no work to do

      var hexCenter = hexBoard.getHexCenterById(this.currentHex);
      var dirx = worldPoint.x - hexCenter.x;
      var diry = worldPoint.y - hexCenter.y;
      var len = Math.sqrt(dirx*dirx + diry*diry);
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
}
   
