
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
      this.spawnDamage = 1;
      this.items = [
      {
         num: 4,
         respawnTime: 20,
         type: CAVE.SPAWN,
         geom: GEOMETRY.QUAD,
         texture: spawnTex            
      },
      {
         num: 2,
         respawnTime: 10,
         type: CAVE.STAR,
         geom: GEOMETRY.QUAD,
         texture: starTex            
      },
      {
         num: 1,
         respawnTime: 30,
         type: CAVE.ORB,
         geom: GEOMETRY.QUAD,
         texture: orbTex            
      },
      {
         num: 1,
         respawnTime: 20,
         type: CAVE.HEART,
         geom: GEOMETRY.QUAD,
         texture: heartTex            
      }
      ];
   }

   increaseDifficulty()
   {
   }
}
