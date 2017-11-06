var PLAYER_MODE = 
{
   NORMAL: 0,
   DEAD: 1,
   FIRE: 2,
   POWERED: 3,
   VICTOR: 4
}

var DEAD =
{
   NONE: 0,
   NOISE: 1,
   BEAST: 2,
   SPAWN: 3
}

class Bullet extends MovingObject
{
   constructor() 
   {
      super();
      this.type = CAVE.BULLET;
      this.enabled = false;
      this.scale = 0.2;
      this.speed = 0.02;
      this.timer = -1;
   }

   update(dt)
   {
      super.update(dt);
   }

   _reachedTarget(idx)
   {
      var targetIdx = this.path[this.path.length-1];
      if (idx !== targetIdx) return;

      player.enableFireMode(false);
      var type = hexBoard.getHexType(idx);
      var playerType = hexBoard.getHexType(player.currentHex);
      if (type === CAVE.BEAST)
      {
         // we win! 
         player.mode = PLAYER_MODE.VICTOR;
      }
      else if (type === CAVE.BLOOD || playerType === CAVE.BLOOD)
      {
         player.kill(DEAD.NOISE);
      }
      else 
      {   
         var npc = lookupNPC(idx);
         if (npc && npc.enabled && npc.type === CAVE.SPAWN)
         {
            npc.kill();
            npc.reactTo(player);
         }
      }

   }
}

class Player extends MovingObject
{
   constructor() 
   {
      super();
      this.type = CAVE.PLAYER;
      this.health = 0;
      this.mode = PLAYER_MODE.NORMAL;
      this.bullet = new Bullet();
      this.death = DEAD.NONE;
   }

   init()
   {
      this.health = gameState.health;
      this.mode = PLAYER_MODE.NORMAL;
      this.speed = 0.01;
      this.bullet.enabled = false;
      this.death = DEAD.NONE;
      this.enabled = true;
   }

   placeInHex(hexIdx)
   {
      super.placeInHex(hexIdx);
      this.scale = hexBoard.b * 0.25;
      this.translate.z = -4.0;
   }

   update(dt)
   {
      if (this.mode == PLAYER_MODE.NORMAL)
      {
         super.update(dt);
         if (Math.abs(this.dir.y) > 0.0 || Math.abs(this.dir.x) > 0.0)
         {
            this.rotate = Math.atan2(-this.dir.x, this.dir.y);
         }      
      }
   }

   _reachedTarget(idx)
   {
      hexBoard.showHexById(idx);
      var type = hexBoard.getHexType(idx);
      if (type === CAVE.BEAST)
      {
         this.kill(DEAD.BEAST);
      }      
      else if (type === CAVE.ORB)
      {
         this.mode = PLAYER_MODE.VICTOR;
      }
      else if (idx !== this.path[0]) 
      {
         var npc = lookupNPC(idx);
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
         var visibleNeighbor = hexBoard.hasVisibleNeighbor(hexIdx);
         if (visibleNeighbor !== -1) 
         {
            var path = hexBoard.computePath(this.currentHex, visibleNeighbor, true, false);
            path.push(hexIdx);
            this.followPath(path);
         }
      }
      else if (isVisible)
      {
         var path = hexBoard.computePath(this.currentHex, hexIdx, true, false);
         this.followPath(path);
      }      
   }

   fire(worldPoint)
   {
      var hexIdx = hexBoard.pointToId(worldPoint);
      if (hexIdx === this.currentHex) return; // no work to do

      if (hexBoard.isNeighbor(this.currentHex, hexIdx))
      {
         var path = hexBoard.computePath(this.currentHex, hexIdx, false, false);
         this.bullet.enabled = true;
         this.bullet.placeInHex(this.currentHex);
         this.bullet.followPath(path);
      }
      else
      {
         this.enableFireMode(false);
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
         this.rotate = Math.atan2(-NEIGHBORS[mini].dir.x, NEIGHBORS[mini].dir.y);
      }
   }

   enableFireMode(on)
   {
      if (on) this.mode = PLAYER_MODE.FIRE;
      else
      {
         this.mode = PLAYER_MODE.NORMAL;
         this.bullet.enabled = false;
      }
   }

   getFireMode()
   {
      return this.mode === PLAYER_MODE.FIRE;
   }

   isVictor()
   {
      return this.mode === PLAYER_MODE.VICTOR;
   }

   isDead() 
   {
      return this.mode === PLAYER_MODE.DEAD;
   }

   getDeathCause()
   {
      return this.death;
   }

   kill(cause)
   {
      this.health = 0;
      this.mode = PLAYER_MODE.DEAD;
      this.death = cause;
   }

   input(worldPoint)
   {
      this.move(worldPoint);
   }

   isMoving()
   {
      return (this.mode === PLAYER_MODE.NORMAL && (this.dir.x > 0.0001 || this.dir.y > 0.0001));
   }   
}
   
