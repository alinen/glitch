
class GameObject
{
   constructor()
   {
      this.type = -1;
      this.enabled = true;

      this.translate = {x:0.0, y:0.0, z:0.0};
      this.rotate = 0.0;
      this.scale = 1.0;

      this.currentHex = -1;
      this.isNPC = false;
   }

   update(dt)
   {
   }

}

