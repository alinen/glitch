
class Player extends MovingObject
{
   constructor() 
   {
      super(CAVE.PLAYER);
      this.isDead = false;
      this.health = 0;
      this.fireMode = false;
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
      if (this.fireMode) return;

      if (Math.abs(this.dir.y) > 0.0 || Math.abs(this.dir.x) > 0.0)
      {
         this.rotate.r = Math.atan2(-this.dir.x, this.dir.y);
      }      
      super.update(dt);
   }

   _reachedTarget(idx)
   {
      hexBoard.showHexById(idx, 1.0);
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
               if (this.health === 0) this.isDead = true;
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
      // todo: allow repathing
      if (this.targetHex !== -1) return; // already going somewhere

      var hexIdx = hexBoard.pointToId(worldPoint);
      if (hexIdx === this.currentHex) return; // no work to do

      var isVisible = hexBoard.isVisibleHex(hexIdx);
      if (!isVisible)
      {
         var visibleNeighbor = -1;
         var allNeighbors = hexBoard.getNeighbors(hexIdx);
         for (var i = 0; i < allNeighbors.length; i++)
         {
            var neighborIdx = allNeighbors[i];
            if (hexBoard.isNeighbor(hexIdx, neighborIdx) && hexBoard.isVisibleHex(neighborIdx))
            {
               visibleNeighbor = neighborIdx;
               break;
            }
         }
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
   }

   aim(worldPoint)
   {
      var startCenter = hexBoard.getHexCenterById(this.currentHex);

      var dirx = worldPoint.x - startCenter.x;
      var diry = worldPoint.y - startCenter.y;
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
         this.dir = {x:ndirx,y:ndiry};
      }
   }

   enableFire()
   {
      this.fireMode = true;
   }

   fire()
   {
      this.fireMode = false;
      this.dir = {x:0,y:0};
   }

   input(worldPoint)
   {
      if (this.fireMode)
      {
         this.aim(worldPoint);
      }
      else
      {
         this.move(worldPoint);
      }
   }
}
   
