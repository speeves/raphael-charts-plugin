/*
 * Raphael Charts plugin - version 0.1
 * Copyright (c) 2010 Boris Kuzmic (boris.kuzmic@gmail.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * 
 */

(function () {
    
    Raphael.fn.charts = {
	
		pie3d : function(cx, cy, R1, R2, values, options) {
		    var paper = this;
		    options = options || {};
		    var o = {
				cx: cx / 2,
				cy: cy / 2,
				R1: R1,
				R2: R2,
				val: values,
				len: values.length,
				total: 0,
				colors: options.colors || [],
				dcolors: [],
				size3d: options.size3d || 15,
				animation: options.animation || false,
				explode: options.explode || false,
				tooltip: options.tooltip || false
		    };
		    
		    var slices = [];
		    
		    function Slice() {
				this.s1="";
				this.s2="";
				this.s3="";
				this.top="";
				this.tx=0;
				this.ty=0;
				this.txm=0;
				this.tym=0;
		    };
		    
		    function SlicePart() {
				this.paths = [];
				this.params = [];
				this.indexes = [];
		    };
			
		    // first point in drawing slice
		    var x = o.cx + o.R1;
		    var y = o.cy;	    	    
		    
		    // calculate total and colors
		    Raphael.getColor.reset();	    
		    for (var i=0;i<o.len;i++) {
				o.total += o.val[i];
				if (o.colors[i] == undefined) o.colors[i] = Raphael.getColor(); 
				o.dcolors[i] = calculateDarkColor(o.colors[i]);	
		    }
		    
		    var aTotal = 360 / o.total; // total in scale of degrees
		    var rad = Math.PI / 180;
		    
		    var valSum = 0; // will hold sum of all values
		    	
		    var draw3dBorder = true;
		    var bPart = new SlicePart;
		    var sPart = new SlicePart;	    	   
		    
		    for (var i=0; i<o.len; i++) {				    		    
				attr1 = {stroke: "none", fill: o.dcolors[i]};
				attr2 = {stroke: "none", gradient: "90-" + o.dcolors[i] + "-" + o.colors[i]};
				    
				xa = x;
				ya = y;
				
				valSum += o.val[i];
				alpha = aTotal * valSum;   	
				x = o.cx + o.R1 * Math.cos(alpha * rad);		    		    
				y = o.cy + o.R2 * Math.sin(alpha * rad);
				    
				// calculate translation coordinates for explode effect
				alphaM = aTotal * (valSum - (o.val[i]/2));
				x4 = o.cx + (o.R1/4) * Math.cos(alphaM * rad);
				y4 = o.cy + (o.R2/4) * Math.sin(alphaM * rad);
				xm = o.cx + o.R1 * Math.cos(alphaM * rad);
				ym = o.cy + o.R2 * Math.sin(alphaM * rad);
				    
				s = new Slice;
				    
				p1 = ["M",xa,ya,"L",o.cx, o.cy,"L",o.cx,o.cy+o.size3d,"L",xa,ya+o.size3d,"z"].join(",");
				p2 = ["M",x,y,"L",o.cx, o.cy,"L",o.cx,o.cy+o.size3d,"L",x,y+o.size3d,"z"].join(",");
				
				if (alpha >= 90 && alpha <= 270) {							    
				    d = paper.path(p1);
				    d.attr(attr1);
				    d.toBack();			
				    s.s1 = d;
				} else {
				    if (aTotal * o.val[i] > 90 ) {			
						d = paper.path(p1);
						d.attr(attr1);
						d.toBack();			    
						s.s2 = d;
				    }
				    if (alpha < 90) {			    
						d = paper.path(p2);
						d.attr(attr1);
						s.s1 = d;
				    } else {
						sPart.paths.push(p2);
						sPart.params.push(attr1);
						sPart.indexes.push(i);			
				    }
			    }
				    
				end3dX = x;
				end3dY = y;
							    
				if (alpha >= 180 && draw3dBorder) {				
				    // draw 3d part only up to 180 deegrees and only once
				    end3dX = o.cx - o.R1;
				    end3dY = o.cy;
					
				    p3 =["M",end3dX,end3dY,"A",o.R1,o.R2,"0","0","0",xa,ya,"L",xa,ya + o.size3d,"A",o.R1,o.R2,"0",
					    "0","1",end3dX,end3dY + o.size3d,"L",end3dX,end3dY].join(",");
					
				    d = paper.path(p3);
				    d.attr(attr2);			
				    s.s3 = d;
					
				    draw3dBorder = false;				
			    }
				
				p4 =["M",x,y,"A",o.R1,o.R2,"0",calculateLargeArcFlag(o.val[i], aTotal),"0",xa,ya,"L",xa,ya + o.size3d,
					"A",o.R1,o.R2,"0",calculateLargeArcFlag(o.val[i], aTotal),
					"1",end3dX,end3dY + o.size3d,"L",end3dX,end3dY].join(",");
				    
				if (draw3dBorder && alpha <= 90) {		   			
				    d = paper.path(p4);
				    d.attr(attr2);							    
				    s.s3 = d;			
				} else if(draw3dBorder && alpha > 90) {
				    bPart.paths.push(p4);
				    bPart.params.push(attr2);			
				    bPart.indexes.push(i);
				}
				    
				s.tx = x4;
				s.ty = y4;
				s.txm = xm;
				s.tym = ym;
				slices[i] = s;
		    }				
			
		    for (var i=sPart.paths.length-1;i>=0;i--) {		    
				d = paper.path(sPart.paths[i]);
				d.attr(sPart.params[i]);
				d.toBack();
				s = slices[sPart.indexes[i]];
				s.s1 = d;
				slices[sPart.indexes[i]] = s;
		    }
			
		    for (var i=bPart.paths.length-1;i>=0; i--) {
				d = paper.path(bPart.paths[i]);
				d.attr(bPart.params[i]);		
				s = slices[bPart.indexes[i]];
				s.s3 = d;
				slices[bPart.indexes[i]] = s;
		    }
		    
		    // draw top slices
		    valSum = 0;
		    for (var i=0; i<o.len; i++) {		    
				attr1 = {stroke: "none", fill: o.colors[i]}; // for testing use also "fill-opacity": 0.5 		   	
					
				valSum += o.val[i];
				    
				xa = x;
				ya = y;	
				alpha = aTotal * valSum;		
				x = o.cx + o.R1 * Math.cos(alpha * rad);
				y = o.cy + o.R2 * Math.sin(alpha * rad);
				    
				if (o.val[i] == o.total) {
				    // draw elipse
				    var e = paper.ellipse(pieX, pieY, R1, R2);
				    e.attr(param);
				    break;
			    } else {			
				    p =["M", o.cx, o.cy, "L", x, y,"A",o.R1, o.R2,"0", calculateLargeArcFlag(o.val[i], aTotal), "0", xa, ya, "L", o.cx, o.cy, "z"].join(","); 
				    d = paper.path(p);
				    d.attr(attr1);
				    //p2.toFront();
				    d.node.setAttribute("class","slice");
				    d.node.setAttribute("id", "slice-" + i);
					
				    s = slices[i];
				    s.top = d;
				    slices[i] = s;			
				}		    		    				    
		    }
		    
		    if (o.animation) {
				for (var i=0;i<o.len;i++) {
				    slices[i].top.num = i;
				    slices[i].top.mouseover(function() {
						if (o.tooltip) showTooltip(this.num, true);
						animateSliceOut(slices[this.num], 1000);
				    }).mouseout(function() {
				    	if (o.tooltip) showTooltip(this.num, false);
						animateSliceIn(slices[this.num],500);
				    });
				}
		    }
		    
		    if (o.explode && !o.animation) {
				for (var i=0;i<o.len;i++) {
				    explodeSlice(slices[i]);
				}
		    }
		    
		    function showTooltip(num, show) {
				var tooltip = $("#tooltip");
				if (show) {
				    s = slices[num];
				    v = Math.round((o.val[num] / o.total) * 100) + "%";				    
				    cur = $(paper.canvas).offset(); //-- doesn't work in opera				    
				    //cur = {left: paper.canvas.offsetLeft, top: paper.canvas.offsetTop}; // works in opera 
				    				    
				    dirx = o.cx - s.txm;
				    if (dirx < 0) pw = 0;
				    else pw = tooltip.width() + 5;
				    var xt = cur.left + Math.round(o.R1 - dirx) - pw;
				    diry = o.cy - s.tym;
				    if (diry < 0) ph = 0;
				    else ph = tooltip.height() + 5;
				    var yt = cur.top + Math.round(o.R2 - diry) - ph;
				    var span = tooltip.find("span");
				    span.css({"border-color": s.top.attr('fill')});
				    span.html(v);
				    tooltip.css({left: xt + "px", top: yt + "px"}).show();
				} else {
				    tooltip.hide();
				}
		    }
		    
		    function animateSliceOut(s, speed) {		
				s.s1.animate({translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);			    
				if (s.s2) s.s2.animateWith(s.s1,{translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);
				if (s.s3) {		    
				    s.s3.animateWith(s.s1, {translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);
				}
				s.top.attr({stroke: "#fff", "stroke-width": 1});
				s.top.animateWith(s.s1, {translation: "" + (s.tx - o.cx) + "," + (s.ty - o.cy)}, speed);		
		    }
		    
		    function animateSliceIn(s, speed) {
				s.s1.stop();
			    cord = s.s1.attr("translation");
				s.s1.animate({translation: "" + (-cord.x) + "," + (-cord.y)}, speed);	    
				if (s.s2) s.s2.animateWith(s.s1, {translation: "" + (-cord.x) + "," + (-cord.y)}, speed);
				if (s.s3) {
				    s.s3.animateWith(s.s1, {translation: "" + (-cord.x) + "," + (-cord.y)}, speed);
				}
				s.top.attr({stroke: "none"});
				s.top.animateWith(s.s1, {translation: "" + (-cord.x) + "," + (-cord.y)}, speed);	    
		    }
		    
		    function explodeSlice(s) {		
				s.s1.translate(s.tx - o.cx,s.ty - o.cy);
				if (s.s2) s.s2.translate(s.tx - o.cx,s.ty - o.cy);
				if (s.s3) s.s3.translate(s.tx - o.cx,s.ty - o.cy);
				s.top.translate(s.tx - o.cx,s.ty - o.cy);
		    }
		    
		    // helper functions
		    function calculateLargeArcFlag(val, aTotal) {		
		    	return (aTotal * val) < 180 ? 0 : 1;		
		    }
	
		},
		
		bar3d : function(cx, cy, values, options) {
		    var paper = this;
		    options = options || {};
		    var o = {	    		
		    	val : values,
		    	len : values.length,
		    	max: 0,
				colors: options.colors || [],
				dcolors: [],
				size3d: options.size3d || -1,
				tooltip: options.tooltip || false,
				labels: options.labels || []
		    };
		    
		    var bar = []; // holder for interactive part of chart, in this case, front rectangle
		    var tooltip = {
		    	text: "",
		    	r: ""
		    }
		    
		    // calculate total and colors
		    Raphael.getColor.reset();			    
		    for (var i=0;i<o.len;i++) {
		    	if (o.val[i] > o.max) o.max = o.val[i];
				if (o.colors[i] == undefined) o.colors[i] = Raphael.getColor(); 
				o.dcolors[i] = calculateDarkColor(o.colors[i]);	
		    }
		    
		    var xs = (cx / o.len);
		    if (o.size3d == -1) o.size3d = xs / 4;		    
		    var maxy = cy - o.size3d - 5;		   
		    var x = 0;
		    var y = 0;
		    var w = xs / 1.5;		    
		    	    
		    for (var i=0; i<o.len;i++) {
		    	attr1 = {stroke: "none", fill: o.colors[i]};		    	
		    	attr2 = {stroke: "none", fill: o.dcolors[i]};
				attr3 = {stroke: "none", gradient: "90-" + o.dcolors[i] + "-" + o.colors[i]};		   
				
		    	h = (maxy / o.max) * o.val[i];			    	
		    	y = maxy - h + o.size3d;		    	
		    	r = paper.rect(x, y, w, h);
		    	r.attr(attr1);
		    	bar[i] = r;
		    	bar[i].num = i;
		    	
		    	if (o.tooltip) {
		    		tooltip.text = paper.text(-100,-100,"");
		    		tooltip.r = paper.rect(-100,-100,1,1);
		    		bar[i].mouseover(function() {
		    			showTooltip(this.num, true);						
					}).mouseout(function() {
						showTooltip(this.num, false);						
					});
		    	}
		    	
		    	// draw top path
		    	p1 = ["M",x,y,"L",x + o.size3d,y - o.size3d,
		    	     "L",x + w + o.size3d, y - o.size3d,
		    	     "L",x + w, y,"z"].join(",");		    	
		    	t = paper.path(p1);
		    	t.attr(attr2);
		    	
		    	
		    	// draw side
		    	p2 = ["M",x + w + o.size3d,y - o.size3d,
		    	      "L",x + w + o.size3d,y + h - o.size3d,
			    	  "L",x + w, y + h,
			    	  "L",x + w, y,"z"].join(",");
		    	s = paper.path(p2);
		    	s.attr(attr3);
		    	
		    	x += xs;		    	
		    }
		    
		    function showTooltip(num, show) {
				//var tooltip = $("#tooltip");
				if (show) {
					b = bar[num];
					lbl = o.labels[num] ? o.labels[num] + " - " : "";
				    lbl = lbl + o.val[num];
				    
				    var xt = b.attr('x') + b.attr('width')/2;
				    var yt = b.attr('y') - o.size3d/2;
				    
				    tooltip.text.attr({x: xt, y: yt,'text':lbl});
				    box = tooltip.text.getBBox();				    
				    tooltip.r.attr({x: box.x-5, y: box.y-2, width: box.width + 10, 
				    				height: box.height + 2, r: 4, stroke: b.attr('fill'),
				    				"stroke-width": 2, fill: "#fff"});
				    tooltip.r.toFront();
				    tooltip.text.toFront();
				    tooltip.r.show();
				    tooltip.text.show();
				    
				    /*var span = tooltip.find('span');
				    span.css({"border-color": b.attr('fill')});
				    span.html(lbl);				    				    
				    cur = $(paper.canvas).offset(); //-- doesn't work in opera				    
				    //cur = {left: paper.canvas.offsetLeft, top: paper.canvas.offsetTop}; // works in opera 				    				   
				    
				    var xt = cur.left + b.attr('x') + o.size3d/2 + b.attr('width')/2 - tooltip.width() / 2;				    
				    var yt = cur.top + b.attr('y') - o.size3d/2 - tooltip.height();				    
				    tooltip.css({left: xt + "px", top: yt + "px"}).show();
				    */
				} else {
				    tooltip.text.hide();
				    tooltip.r.hide();
				}
		    }
		    
		}
	
    };
    
    // helper functions
    function calculateDarkColor(color) {
		c = Raphael.getRGB(color);
		r = parseInt(c.r) - 66;
		g = parseInt(c.g) - 60;
		b = parseInt(c.b) - 54;
		darkcolor = "#" + toHex(r) + toHex(g) + toHex(b);			    
		return darkcolor;
    }
    
    function toHex(N) {
		if (N==null) return "00";
		N=parseInt(N); if (N==0 || isNaN(N)) return "00";
		N=Math.max(0,N); N=Math.min(N,255); N=Math.round(N);
		return "0123456789ABCDEF".charAt((N-N%16)/16)
			+ "0123456789ABCDEF".charAt(N%16);
    }	

})();