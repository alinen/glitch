
var ITEMS =
{
   WAMPUS: 0,
   SPAWN: 1,
   STAR: 2,
   ORB: 3,
   ENERGY: 4,
   BLOOD: 5
}

class GameState
{
   constructor()
   {
      this.reset();
   }

   reset()
   {   
      this.health = 4;
      this.starDuration = 10;
      this.spawnDamage = 1;
      this.numWampus = 10;
      this.items = [
      {
         num: 16,
         respawnTime: 5,
         type: CAVE.SPAWN,
         geom: GEOMETRY.SPAWN
      },
      {
         num: 0,
         respawnTime: 10,
         type: CAVE.STAR,
         geom: GEOMETRY.STAR
      },
      {
         num: 1,
         respawnTime: 10,
         type: CAVE.ORB,
         geom: GEOMETRY.ORB
      }
      ];
   }

   increaseDifficulty()
   {
   }
}
