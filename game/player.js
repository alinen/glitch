
class Player extends MovingObject
{
   constructor() 
   {
      super(CAVE.PLAYER);
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
      this.speed = 0.01;
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
      hexBoard.showHexById(idx);
      var type = hexBoard.getHexType(idx);
      if (type === CAVE.BEAST)
      {
         this.health = 0;
         this.isDead = true;
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

   move(worldPoint)
   {
      if (this.targetHex !== -1) return; // already going somewhere
      var hexIdx = hexBoard.pointToId(worldPoint);
      if (hexIdx === this.currentHex) return; // no work to do

      var isVisible = hexBoard.isVisibleHex(hexIdx);
      if (!isVisible)
      {
         var visibleNeighbor = hexBoard.hasVisibleNeighbor(hexIdx);
         if (visibleNeighbor !== -1) 
         {
            var path = hexBoard.computePath(this.currentHex, visibleNeighbor, true);
            path.push(hexIdx);
            this.followPath(path);
         }
      }
      else if (isVisible)
      {
         var path = hexBoard.computePath(this.currentHex, hexIdx, true);
         this.followPath(path);
      }
      else // show direction with the mouse
      {
         var dir = hexBoard.getDir(this.currentHex, hexIdx);
         var minAngle = Math.PI*4;
         var mini = -1;
         for (var i = 0; i < NEIGHBORS.length; i++)
         {
            var angle = Math.acos(dir.x * NEIGHBORS[i].dir.x + dir.y * NEIGHBORS[i].dir.y);
            if (angle < minAngle)
            {
               mini = i;
               minAngle = angle;
            }
         }

         if (mini !== -1) 
         {
             this.rotate.r = Math.atan2(-NEIGHBORS[mini].dir.x, NEIGHBORS[mini].dir.y);
         }
      }

   }
}
   
