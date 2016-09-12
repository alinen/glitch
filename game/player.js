
class Player
{
   constructor() 
   {
      this.speed = 0.005;
      this.pos = {x:0, y:0};
      this.translate = {x:0,y:0,z:-5},
      this.scale = {s:1},
      this.rot = {r:0},
      this.dir = {x:0, y:0};
      this.nextDir = {x:0, y:0};
      this.currentHex = -1;
      this.targetHex = -1;
      this.nextHex = -1;
   }

   placeInHex(hexIdx)
   {
      this.pos = hexBoard.getHexCenterById(hexIdx);
      hexBoard.showHexById(hexIdx, 0.95);
      console.log("place player: " + this.pos.x + " " + this.pos.y + " id: " + hexIdx);
   
      this.dir = {x:0,y:0};
      this.nextDir = {x:0,y:0};

      this.currentHex = hexIdx;
      this.targetHex = -1;
      this.nextHex = -1;
      this.scale.s = hexBoard.b * 0.25;
   }   

   passedTarget(targetPos, threshold)
   {
      var dot = targetPos.x * this.pos.x + targetPos.y * this.pos.y;
      if (dot < 0) return true; 

      var dSqr = (targetPos.x - this.pos.x)*(targetPos.x - this.pos.x) + 
                 (targetPos.y - this.pos.y)*(targetPos.y - this.pos.y);

      return (dSqr < threshold);
   }

   update(dt)
   {
      this.pos.x += dt * this.dir.x * this.speed;
      this.pos.y += dt * this.dir.y * this.speed;

      if (this.targetHex > -1)
      {
         var target = hexBoard.getHexCenterById(this.targetHex);
         if (this.passedTarget(target, 0.01))
         {
            hexBoard.showHexById(this.targetHex, 1.0);
   
            this.dir = this.nextDir;
            this.nextDir = {x:0,y:0};
            this.currentHex = this.targetHex;
            this.targetHex = this.nextHex;
            this.nextHex = -1;
            this.pos = target;
            //console.log("update "+this.currentHex+" "+this.targetHex+" "+this.nextHex);
         }
      }
   
      if (Math.abs(this.dir.y) > 0.0 || Math.abs(this.dir.x) > 0.0)
      {
         this.rot.r = Math.atan2(-this.dir.x, this.dir.y) / DEG2RAD;
      }

      this.translate.x = this.pos.x; 
      this.translate.y = this.pos.y; 
   }

   attemptMove(move)
   {
      //console.log("attepmptMove "+this.currentHex);
      if (!this.isMoving())
      {
         var nextIdx = hexBoard.isValidMove(this.currentHex, move);         
         if (nextIdx !== -1)
         {
            this.dir = move.dir;
            this.targetHex = nextIdx;
         }
      }
      else
      {
         var nextIdx = hexBoard.isValidMove(this.targetHex, move); 
         if (nextIdx !== -1)
         {
            this.nextDir = move.dir;
            this.nextHex = nextIdx;
         }
      }
   }
   
   isMoving()
   {
      return (this.dir.x > 0.0001 || this.dir.y > 0.0001);
   }

   clearDir()
   {
      this.dir = {x:0, y:0};
      this.nextDir = {x:0, y:0};
      this.targetHex = -1;
      this.nextHex = -1;
   }
}
   
