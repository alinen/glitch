
var ITEMS =
{
   WAMPUS: 0,
   SPAWN: 1,
   STAR: 2,
   ORB: 3,
   ENERGY: 4
}

class GameState
{
   constructor()
   {
      this.reset();
   }

   reset()
   {   
      this.health = 3;
      this.starDuration = 10;
      this.items = [
      {
         num: 1,
         respawnTime: -1,
         geom: GEOMETRY.QUAD,
         texture: spawnTex
      },
      {
         num: 4,
         respawnTime: 20,
         geom: GEOMETRY.QUAD,
         texture: spawnTex            
      },
      {
         num: 2,
         respawnTime: 10,
         geom: GEOMETRY.QUAD,
         texture: starTex            
      },
      {
         num: 1,
         respawnTime: 30,
         geom: GEOMETRY.QUAD,
         texture: orbTex            
      },
      {
         num: 1,
         respawnTime: 20,
         geom: GEOMETRY.QUAD,
         texture: heartTex            
      }
      ];
   }

   increaseDifficulty()
   {
   }
}
