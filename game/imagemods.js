

function blend(canvasA, canvasB, canvasC, t)
{
   var ctxA = canvasA.getContext('2d');
   var ctxB = canvasB.getContext('2d');
   var ctxC = canvasC.getContext('2d');

   var imgA = ctxA.getImageData(0,0,canvasA.width, canvasA.height);
   var imgB = ctxB.getImageData(0,0,canvasB.width, canvasB.height);
   var imgC = ctxC.getImageData(0,0,canvasC.width, canvasC.height);

   var numPixels = result.width * result.height; // needs to be same for all of them
   for (var i = 0; i < numPixels; i++)
   {
      for (var p = 0; p < 3; p++)
      {
         var tmp = t* imgA.data[i*4+p] + (1.0-t)* imgB.data[i*4+p];
         imgC.data[i*4+p] = tmp;
      }
      imgC.data[i*4+3] = 255;
   }
   ctxC.putImageData(imgC, 0, 0);
}

function gradientFill(canvas)
{
    var ctx = canvas.getContext('2d');   
    var cxlg=ctx.createLinearGradient(0, 0, canvas.width, 0);
    cxlg.addColorStop(0, '#f00');
    cxlg.addColorStop(0.5, '#0f0');
    cxlg.addColorStop(1.0, '#00f');

    ctx.fillStyle = cxlg;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

function noiseFill(canvas)
{
   var ctx = canvas.getContext('2d');

   ctx.fillStyle = '#fff';
   ctx.fillRect(0,0,canvas.width,canvas.height);
   var img = ctx.createImageData(canvas.width, canvas.height);
   var numPixels = canvas.width * canvas.height;
   for (var i = 0; i < numPixels; i++)
   {
      var intensity = Math.random() * 255;
      img.data[i*4+0] = intensity;
      img.data[i*4+1] = intensity;
      img.data[i*4+2] = intensity;
      img.data[i*4+3] = 255;
   }
   ctx.putImageData(img, 0, 0);
}

/*
function randomGradients(canvas, pallet, stride)
{
    cmap = matplotlib.colors.makeMappingArray(100, plt.get_cmap(name), gamma=1.0)
    color1 = 0
    color2 = 0
    for i in range(height):      
        if i % stride == 0:
            intensity1, intensity2 = np.random.random_sample(2)
            
            idx1 = (int) (intensity1 * 100)
            color1 = cmap[idx1]

            idx2 = (int) (intensity2 * 100)
            color2 = cmap[idx2]
            
        for j in range(width):
            t = j/float(width)
            img[i][j][0] = t * cmap[idx1][0] + (1-t) * cmap[idx2][0]
            img[i][j][1] = t * cmap[idx1][1] + (1-t) * cmap[idx2][1]
            img[i][j][2] = t * cmap[idx1][2] + (1-t) * cmap[idx2][2]
        
    return img
}*/

function randomStripes(canvas, pallet, stride)
{
   var ctx = canvas.getContext('2d');
   var img = ctx.getImageData(0,0,canvas.width, canvas.height);
   var numPixels = canvas.width * canvas.height;
   var depth = 4;

   var r = 0;
   var g = 0;
   var b = 0;
   var cmap = colormaps.get(pallet);
   var numColors = cmap.length/3;
   for (var i = 0; i < canvas.height; i++)
   {
      if (i % stride == 0)
      {        
         var idx = Math.floor(Math.random() * numColors);
         r = cmap[idx * 3 + 0] * 255;
         g = cmap[idx * 3 + 1] * 255;
         b = cmap[idx * 3 + 2] * 255;
      }     
      for (var j = 0; j < canvas.width; j++)
      {
         var currentIdx = i * canvas.width * depth + j * depth;
         img.data[currentIdx+0] = r;
         img.data[currentIdx+1] = g;
         img.data[currentIdx+2] = b;
         img.data[currentIdx+3] = 255;
      }
   }   
   ctx.putImageData(img, 0, 0);   
}

function subVertical(canvas, distance)
{
   var ctx = canvas.getContext('2d');
   var img = ctx.getImageData(0,0,canvas.width, canvas.height);
   var numPixels = canvas.width * canvas.height;
   var depth = 4;
   var newimg = ctx.createImageData(canvas.width, canvas.height);   
   for (var i = 0; i < canvas.height; i++)
   {
      for (var j = 0; j < canvas.width; j++)
      {
         var r = Math.floor(Math.random() * 2 * distance) - distance;
         var backpixel = Math.min(canvas.height-1, Math.max(0, i + r));
         var currentIdx = i * canvas.width * depth + j * depth;
         var backpixelIdx = backpixel * canvas.width * depth + j * depth;
         newimg.data[currentIdx+0] = img.data[backpixelIdx+0];
         newimg.data[currentIdx+1] = img.data[backpixelIdx+1];
         newimg.data[currentIdx+2] = img.data[backpixelIdx+2];
         newimg.data[currentIdx+3] = 255;
      }
   }
   ctx.putImageData(newimg, 0, 0);
}

function smoothBox(canvas, neighborhood)
{
   if (neighborhood == 0)
   {
      return; // no work to do!
   }

   var ctx = canvas.getContext('2d');
   var img = ctx.getImageData(0,0,canvas.width, canvas.height);
   var numPixels = canvas.width * canvas.height;
   var depth = 4;

   var newimg = ctx.createImageData(canvas.width, canvas.height);   
   for (var i = 0; i < canvas.height; i++)
   {
      for (var j = 0; j < canvas.width; j++)
      {
         var centerIdx = i*canvas.width*depth+j*depth;
         var aveR = img.data[centerIdx+0];
         var aveG = img.data[centerIdx+1];
         var aveB = img.data[centerIdx+2];
         
         var count = 1.0;
         for (var ii = i-neighborhood; ii < i+neighborhood; ii++)
         {
            var ki = Math.min(canvas.height-1, Math.max(0, ii));
            for (var jj = j-neighborhood; jj < j+neighborhood; jj++)
            {
               var kj = Math.min(canvas.width-1, Math.max(0, jj));
               var currentIdx = ki * canvas.width * depth + kj * depth;
               aveR += img.data[currentIdx+0];
               aveG += img.data[currentIdx+1];
               aveB += img.data[currentIdx+2];
               count += 1.0;
            }
         }
         newimg.data[centerIdx+0] = aveR/count;
         newimg.data[centerIdx+1] = aveG/count;
         newimg.data[centerIdx+2] = aveB/count;
         newimg.data[centerIdx+3] = 255;
      }
   }
   ctx.putImageData(newimg, 0, 0);
}

