// written by Rayan Chikhi in 2014
// BSD License 
// started from the Hello World example from https://github.com/bitliner/d3-bipartite-graph


var svg;

var max_ni = 0;
var first_ni = 0;
var last_ni = 0;

var width = 850;

var node_radius = 10;
var bipartite_left_x = 300, 
    bipartite_right_x = 560,
	bipartite_y_spacing = 40;
	
var labels_font_size = "12px";
	
var display_ni = Array();
var nb_nis = Array();

var color = d3.scale.category20();

var nodes_labels_right, nodes_labels_left;
var links, nodes;

var selection_mode = false; // add/remove edge selection mode
var one_node_selected = false; // whether at least one node has been selected
var only_hadamard_edges = false; // only allow edges if <left node id, right node id> = 1 (mod 2)

// assign colors to nis
colors = ['rgb(166,206,227)','rgb(31,120,180)','rgb(178,223,138)','rgb(51,160,44)','rgb(251,154,153)','rgb(227,26,28)','rgb(253,191,111)','rgb(255,127,0)','rgb(202,178,214)','rgb(106,61,154)','rgb(185,185,10)']
var edge_color = function(ni)
{
	if (ni == MAGIC_MISSING_HADAMARD_EDGES_NI) return 0;
	return colors[ni % colors.length];
}
	
var labelling;
var letter_ni;

// the nodes id must be "l-xxx" or "r-xxx"
var setup_graph = function(lexi_order) {

	console.log("drawing graph with nodes/links as:");
	console.log("graph.nodes", nodes)
	console.log("graph.links", links)	
	// assign x,y coordinates to nodes
	var max_y = 0;
	for (var i = 0; i < nodes.length; i++) {
		var label = nodes[i].id;

		if (lexi_order)
		{
			node_number = parseInt( label.substring(2, label.length), 2 ) - 1;
			nodes[i].y = 20 + node_number * bipartite_y_spacing;
		}
		else
			nodes[i].y = 20 + nodes[i].biclique_order * bipartite_y_spacing;
		
		
		max_y = Math.max(nodes[i].y, max_y);
		nodes[i].fixed = true;
		if (label[0] == "l")
		{
			nodes[i].x = bipartite_left_x;
		}
		if (label[0] == "r")
		{
			nodes[i].x = bipartite_right_x;
		}
	}
	
	// create force layout
	var height = max_y + 30;
	var force = d3.layout.force().size([width, height]).charge(-300).linkDistance(20);
	
	d3.select("svg").remove(); // clear previous graph
	svg = d3.select("#bipartitegraph").append("svg").attr("width", width).attr("height", height).append('svg:g')
	//.call(d3.behavior.zoom().on("zoom", redraw)); // awkward redraw on click to move nodes
	
	// adding background rect to catch clicked
	svg.append('svg:rect').attr('class', 'background').attr('x', bipartite_left_x + 1.8*node_radius).attr('y', 0).attr('width', bipartite_right_x - bipartite_left_x - 1.8*2*node_radius).attr('height', height).style('opacity', 0.0);
    svg.selectAll('.background').on("click", background_click);

	// start force layout
	force.nodes(nodes).links(links);


	var link = svg.selectAll(".link").data(links, function( d) {  return links.indexOf(d);}).enter().append("line").attr("class", "link")
	.style("stroke-width", 2)
	.style("stroke", function (d) { return edge_color(d.ni); });
	
	var node=svg.selectAll('g.node').data(nodes).enter().append('svg:g').attr('class','node').on("click", node_click)
	//.call(force.drag); // disable dragging
	var circles=node.append('circle').attr("r", node_radius).style("fill", function(d) {
		return color(d.group);
	});
	
	// place labels (l-XXX and r-XXX)
	var texts=node.append('svg:text').style("font-size","14px").attr("dx", 16).attr("dy", ".35em").text(function(d){if (d.bipartite == 1) return d.id});
	node.append('svg:text').style("font-size","14px").attr("dx", -62).attr("dy", ".35em").text(function(d){if (d.bipartite == 0) return d.id});
	
	// mouse over on node
	node.append("title").text(function(d){	return d.id;});

	// place labelling
	nodes_labels_right=node.append('svg:text').style("font-size","14px").attr("dx", 10).attr("dy", "1.45em").style("font-size",labels_font_size).style("font-family","courier");
	nodes_labels_left=node.append('svg:text').style("font-size","14px").attr("dx", -10).attr("dy", "1.45em").style("text-anchor", "end").style("font-size",labels_font_size).style("font-family","courier");
	
	
	// not sure what all this code does
	force.on("tick", function() {
		link.attr("x1", function(d) {
			return d.source.x;
		}).attr("y1", function(d) {
			return d.source.y;
		}).attr("x2", function(d) {
			return d.target.x;
		}).attr("y2", function(d) {
			return d.target.y;
		});

		// don't know
/*		circles.attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});*/
		/*texts.attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});*/

		// when nodes coordiantes aren't fixed, at least make it bipartite
		node.attr("transform", function(d) {
			var x=d.x,
				y=d.y; 
			/*if ( d.bipartite=='0'){
				x=100
				d.x=x
			}
			if (d.bipartite=='1'){
				x=600
				d.x=x
			}*/
			return "translate(" + x + "," + y + ")"; 
		});
	});
	
	  force.start();
		  for (var i = 20000; i > 0; --i) force.tick();
		  force.stop();
		  
	/* so, at this point, links is modified. links[i].source returns an object (with .index property) instead of the index */

	// apply normal opacity style
	unhighlight();

}

var set_nb_nis = function()
{
	nb_nis = Array();
	var dynamic_max_ni = 0;
	for (var i = 0; i < links.length; i++) {
		var ni = links[i].ni;
		dynamic_max_ni = Math.max(dynamic_max_ni, ni);
		if (ni in nb_nis)
			nb_nis[ni] += 1;
		else
			nb_nis[ni] = 1;
	}
	
	// now emulate defaultdict by setting all undefined to zero
	
	for (var i = 0; i <= Math.max(max_ni/*the global one*/,dynamic_max_ni); i++)
	{
		if (nb_nis[i] == undefined)
			nb_nis[i] = 0;
	}
	if (nb_nis[MAGIC_MISSING_HADAMARD_EDGES_NI] == undefined) // "special" ni
			nb_nis[MAGIC_MISSING_HADAMARD_EDGES_NI] = 0;
	
	return dynamic_max_ni;
}

function load_h4_labelling()
{
	labelling = {"l-1110": "yyyyyyyyaecfdacffdcgebaeacfdabaecffdagab", "l-1111": "yyyyyyyaecdcgebgabdcgebaeacffdagabacgebd", "r-0100": "dcgebaeacfdabaecffdagabzzzzzzzzzzzzzzzzz", "r-0101": "baeacffdafdebdgaecdcgzzzzzzzzzzzzzzzzzzz", "l-1011": "yyyyyyyyyyyyyyyyyyyycgebgabdfdebaeacffda", "l-1010": "yyyyyyyyyyyyyyyyyyyyyyyyyygabdfdebdgabac", "r-0001": "dabaecgebgabdfdebzzzzzzzzzzzzzzzzzzzzzzz", "r-1110": "bdgaeczzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz", "r-1111": "aecfdacffdcgebaeacfdabaecffdagabzzzzzzzz", "r-1011": "aecdcgebgabdcgebaeacffdagabacgebdzzzzzzz", "r-1010": "fdebdgaecdcgacffdcgebdcfdabzzzzzzzzzzzzz", "l-0100": "yyyyyyyyyyyyyyyyyyyyyyyyyyaecfdacffdcgeb", "l-0101": "yyyacffdcgebdcfdabaecffdagabaecdcgebgabd", "l-0001": "yyyyyyyyyyyyyyygabdfdebdgabacgebdcfdabae",  "l-1101": "yyyyyyygabdfdebdgabacgebdcfdabaecfdacffd", "l-1100": "yyyyyyebdgabacaecfdaecdcgebgabdcgebaeacf", "r-0111": "ebdgabacaecfdaecdcgebgabdcgebaeacfzzzzzz", "r-0110": "acffdcgebdcfdabaecffdagabaecdcgebgabdzzz", "r-0010": "abacgebdgabacaecfdbaeacffdafdebdgaecdcgz", "r-0011": "gabdfdebdgabacgebdcfdabaecfdacffdzzzzzzz", "r-1000": "cffdagabacgebdabaecgebgabdfdebzzzzzzzzzz", "r-1001": "cfdabaecffdagabaecdcgebgabdzzzzzzzzzzzzz", "l-1000": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyfdebdgaec", "l-1001": "yyyyyyyyyycffdagabacgebdabaecgebgabdfdeb", "r-1101": "cgebdcfdabaecfdacffdzzzzzzzzzzzzzzzzzzzz", "r-1100": "cgebgabdfdebaeacffdabacgebdgabacaecfdzzz", "l-0010": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyfdebdga", "l-0011": "yyyyyyyyyyyyyfdebdgaecdcgacffdcgebdcfdab", "l-0111": "yyycgebgabdfdebaeacffdabacgebdgabacaecfd", "l-0110": "yabacgebdgabacaecfdbaeacffdafdebdgaecdcg"}
	
	load_graph();
}

function load_h3_labelling()
{
    // optimal: readability is at least 5 (checked by Martin, 12/14/13 email)
    labelling = { "l-001": "ffadb", "l-010": "adbgc", "l-011": "ffdbc", "l-100": "fcbad", "l-101": "fdacb", "l-110": "fbgcd", "l-111": "fbcda",  "r-001": "bcdaf", "r-010": "cdaff", "r-011": "bgcdf", "r-100": "dacbf", "r-101": "dbcff", "r-110": "cbadf", "r-111": "adbgc"}
    load_graph();
}


// loads a graph given a labelling (global variable)
var load_graph = function(){
	// compute n, m from labelling
	var n = 0, m = 0;
	for (var node_id in labelling) {
		if (node_id[0] == "l")
			n += 1;
		else
			m += 1;
	}

	// set up an empty n x m graph
	new_graph(n, m);
	
	// load the labelling
	max_ni = nis_from_labelling(links, nodes, labelling, false);
	
	// annotate nodes such that the first biclique is well-displayed
	// requires that links are annotated with ni's 
	nodes_in_biclique_order(1, nodes, links);
	
	draw_graph(false); // set it to true to force lexicographical order (right now is biclique order); this could be an interface parameter..

	update_selection_div(false);
}

function highlight(chosen_i)
{
	is_highlighting = true;
	var link = svg.selectAll(".link").transition().style("stroke-opacity", function(d) { return ((d.ni == chosen_i) ? 0.8 : 0.05);});
}

function unhighlight()
{
	var link = svg.selectAll(".link").transition().style("stroke-opacity", 0.8);
}

function update_links(do_not_update_stats)
{
	var stroke_width  = function(d)
	{
		if (d.selected)
			return 4;
		return display_ni[d.ni] ? 2 : 0;
	}
	
	var stroke = function(d)
	{
		if (d.selected)
		{
			return 'rgb(185,185,10)';
		}
		return edge_color(d.ni); 
	}

	if (svg == undefined)
		return;
		
	// can't bother understanding d3's update of elements, let's just mask removed ones
	link = svg.selectAll(".link").data(links, function( d) {  return links.indexOf(d);})
		.style("stroke-width", stroke_width)
		.style("stroke", stroke);
		
	if (do_not_update_stats == undefined || do_not_update_stats == false)
		update_stats();
	
}

function update_stats()
{
	var nb_displayed_edges = 0;
	var nb_neighbors = [];
	var is_matching = true;
	for (var j = 0; j < links.length; j ++)
	{
		var link = links[j];
		var ni = link.ni;
		if (ni == 0)
			continue;
		if (! display_ni[ni] )
			continue;
		nb_displayed_edges += 1;
		var tmp_nodes = [link.source.index, link.target.index];
		tmp_nodes.map(function (nd)
		{
			if (nb_neighbors[nd] === undefined)
				nb_neighbors[nd] = 1;
			else
			{
				nb_neighbors[nd] += 1;
				is_matching = false;
			}
		});

	}
	var divnistats = document.getElementById('ni-stats');
	html = "<b>" + nb_displayed_edges + "</b> edges in selected G<sub>i</sub>'s";
	if (is_matching && nb_displayed_edges > 0)
		html += " <font color='green'>(matching)</font>"
	divnistats.innerHTML = html;
}

// ---------- code to create a new graph (not from a Json file)

var nb_left_nodes, nb_right_nodes;
function get_link_index(left,right) 
{
	return ((right-nb_left_nodes)*nb_left_nodes+left);
}

function padBinary(number, max_number)
{
	var len = Math.ceil(Math.log(max_number) / Math.log(2));
	var n = number.toString(2);
	return (new Array(len + 1).join('0') + n).slice(-len)
}

var new_graph = function(n,m){

	nodes = new Array();
	links = new Array();
	
	// emulate a json set of nodes as exported by python..
	for (var i = 0; i < n; i++) {
		nodes[i] = {};
		nodes[i].id = "l-" + padBinary(i+1,n+1);
		nodes[i].bipartite = 0;
	}
	for (var i = 0; i < m; i++) {
		nodes[i + n] = {};
		nodes[i + n].id = "r-" + padBinary(i+1,m+1);
		nodes[i + n].bipartite = 1;
	}

	nb_left_nodes = n; // save that for get_link_index()
	nb_right_nodes = m; // save that for get_link_index()
	
	// since I don't know how to add/remove links in d3, let's just add all possible edges and mask them later
	for (var i = 0; i < n; i++) {
		for (var j = 0; j < m; j++) {
			var temp = {};
			temp.source = i;
			temp.target = n+j;
			temp.ni = 0;
			links[get_link_index(i,n+j)] = temp;
		}
	}
	
}

// needs to be called _after_ the node have been annotated for ordering
function draw_graph(lexi_order)
{
	setup_graph(lexi_order);

	compute_missing_hadamard_edges();	
	set_nb_nis();

	// display all ni's at first
	for( var i = 1; i <= max_ni; i++ ){
		display_ni[i] = true;
	}
	display_ni[0] = false;
	update_links(); // hide all edges
	index_callback(); // call index callback once graph is loaded	
	label_graph(links);
}


// ---------- functions to handle adding edges to ni's through clicking nodes.. tricky..


var left_clicked = undefined, right_clicked = undefined;

function node_click(node,node_index) {
		
	var label = node.id;
	
	if (one_node_selected && only_hadamard_edges && (!node.hadamard))
		return;
	
	if (label[0] == "l")
		left_clicked = node_index;
	if (label[0] == "r")
		right_clicked = node_index;
		
	if (node.selected)
		node.selected = false;
	else
		node.selected = true;

	update_hadamard_edges();
	update_selected_edges();
	update_displayed_nodes();
}

function is_hadamard_edge(left, right)
{
	a = left.substring(2, left.length);
	b = right.substring(2, right.length);
	var n = 0, lim = Math.min(a.length,b.length);
	for (var i = 0; i < lim; i++) n += a.charAt(i) * b.charAt(i);
	return (n % 2) == 1;
}

function update_hadamard_edges()
{
	for (var i = 0; i < nb_left_nodes; i++) {
		var left = nodes[i];
		left.hadamard = true;
		for (var j = 0; j < nb_right_nodes; j++) {
			var right = nodes[nb_left_nodes+j];
			if (!right.selected)
				continue;
			if (!is_hadamard_edge(left.id,right.id))
				left.hadamard = false;
		}
	}
	
	for (var j = 0; j < nb_right_nodes; j++) {
		var right = nodes[nb_left_nodes+j];
		right.hadamard = true;
		for (var i = 0; i < nb_left_nodes; i++) {
			var left = nodes[i];
			if (!left.selected)
				continue;
			if (!is_hadamard_edge(left.id,right.id))
				right.hadamard = false;
		}
	}
}

function update_selected_edges()
{
	// compute which links are selected
	selection_mode = false;
	one_node_selected = false;
	for (var i = 0; i < nb_left_nodes; i++) {
		for (var j = 0; j < nb_right_nodes; j++) {
			var left = nodes[i], right = nodes[nb_left_nodes+j];
			link = links[get_link_index(i,nb_left_nodes+j)];
			if (left.selected || right.selected)
			{
				one_node_selected = true;
			}
			if (left.selected && right.selected)
			{
				link.selected = true;
				selection_mode = true;
			}
			else
				link.selected = false;
			}
	}
	
	update_links();

	update_selection_div(selection_mode);
}

function add_remove_selected_edges(ni)
{
	// assign set edges to n_i's
	for (var i = 0; i < nb_left_nodes; i++) {
		for (var j = 0; j < nb_right_nodes; j++) {
			var left = nodes[i], right = nodes[nb_left_nodes+j];
			link = links[get_link_index(i,nb_left_nodes+j)];
			if (left.selected && right.selected)
				link.ni = ni;
		}
	}
	
	compute_missing_hadamard_edges();
	set_nb_nis();
	
	background_click(); // reset selection

	label_graph(links);
}

function update_displayed_nodes()
{
	var node_r = function(d) {
		if (d.selected)
			return node_radius*1.6;
		if (one_node_selected && only_hadamard_edges && (!d.hadamard))
			return node_radius*0.7;
		return node_radius;
	};
	
	var node_color = function(d) {
		if (d.selected)
			return 0;
		if (one_node_selected && only_hadamard_edges && (!d.hadamard))
			return "#808080";
		return color(d.group);
	};
	
	d3.selectAll('g.node').select("circle").transition()
        .duration(250)
        .attr("r", node_r)
        .style("fill", node_color);
}

// deselect all
function background_click()
{
	for (var i = 0; i < nb_left_nodes; i++) {
		var left = nodes[i];
		left.selected = false;
	}
	for (var j = 0; j < nb_right_nodes; j++) {	
		var	right = nodes[nb_left_nodes+j];
		right.selected = false;
	}
	update_selected_edges();
	update_displayed_nodes();
	set_non_empty_nis_in_selection();
}


// ----------- draft code for displaying "feasible" ni's starting from a ni 
// (not active)

var feasible_nis = new Array();

function can_label_selected_edges(ni)
{
	var temporary_links = jQuery.extend(true, new Array(), links); // deep copy of links (http://stackoverflow.com/a/122704)
	
	// add selected edges as n_j
	for (var i = 0; i < nb_left_nodes; i++) {
		for (var j = 0; j < nb_right_nodes; j++) {
			var left = nodes[i], right = nodes[nb_left_nodes+j];
			link = temporary_links[get_link_index(i,nb_left_nodes+j)];
			if (left.selected && right.selected)
				link.ni = ni;
		}
	}
	
	return label_graph(temporary_links);
}

function update_feasible_nis()
{
	// can we label graph + selected edges in N_j, j=1..max_ni
	for (var ni = 0; ni <= max_ni; ni++)
	{
		feasible_nis[ni] = can_label_selected_edges(ni);
		console.log(feasible_nis);
	}
}

// --------------- code to label the nodes


function label_graph(given_links)
{
	if (given_links == undefined)
		given_links = links;
	
	var nis = new Array;
	// create nis
	for (var i = 0; i < nb_left_nodes; i++) {
		for (var j = 0; j < nb_right_nodes; j++) {
			var left = nodes[i], right = nodes[nb_left_nodes+j];
			link = given_links[get_link_index(i,nb_left_nodes+j)];
			ni = link.ni;
			if (ni == 0 || ni > max_ni)
				continue;
			if (nis[ni] == undefined)
				nis[ni] = new Array();
			nis[ni].push(link);
		}
	}
	
	var temp_labelling = labelling_from_nis(nis, nodes)
	if (temp_labelling == undefined)
		return false;
	res = nis_from_labelling(given_links, nodes, temp_labelling.labels, true);
	if (res == 0) // nis_from_labelling will fail if we introduced false positive links
		return false;
	
	labelling = temp_labelling.labels;
	letter_ni = temp_labelling.letter_ni;
	
	// update node titles (for hover)
	var node=svg.selectAll('g.node');
	node.select("title").text(function(d){	return labelling[d.id];});
	
	update_nodes_labels()
	
	return true;
}

function update_nodes_labels()
{
	// very complicated due to impossibility to change text color in the middle of a svg text element
	//nodes_labels_left.text(function(d){	return d.id[0] == 'l' ? labelling[d.id] : "" ;});
	nodes_labels_left.text("");
	for (var i = 0; i < max_ni; i++) 
		nodes_labels_left.append("svg:tspan").style("fill", function (d) { return label_letter_color_function(d,i,"l") } ).text(function (d) { return label_letter(d,i,"l") } );

	//nodes_labels_right.text(function(d){	return  d.id[0] == 'r' ? labelling[d.id] : "";});
	nodes_labels_right.text("");
	for (var i = 0; i < max_ni; i++)
		nodes_labels_right.append("svg:tspan").style("fill", function (d) { return label_letter_color_function(d,i,"r") } ).text(function (d) { return label_letter(d,i,"r") } );
}

function label_letter_color_function(d,i,o)
{
	if (d.id[0] != o)
		return "";
	var color = edge_color(letter_ni[d.id][i]);
	if (color !== undefined)
	{
		return d3.rgb(color)//.darker();
	}
	return "";
}

function label_letter(d,i,o)
{
	if (d.id[0] != o)
		return "";
	var letter = labelling[d.id][i];
	if (letter == "y" || letter == "z")
		return "";
	return letter;
}

//----------------- load/save graph

function import_export()
{
	var entered_labelling=prompt('Copy this text to save the labelling, paste a labelling to import it',JSON.stringify(labelling));
	if (entered_labelling && entered_labelling!='') 
	{
		labelling = jQuery.parseJSON( entered_labelling );
		load_graph();
	}
}

// -------------- hack to display missing hadamard edges

var MAGIC_MISSING_HADAMARD_EDGES_NI = 123321; // i realize this is an ugly hack, but it avoids creating a special case for hovers, so...
function get_list_nis()
{
	var list_nis = [];
	for (var i = 1; i <= max_ni; i++) {
		list_nis.push(i);
	}
	list_nis.push(MAGIC_MISSING_HADAMARD_EDGES_NI); // special n_i for missing hadamard edges
	return list_nis;
}

function compute_missing_hadamard_edges()
{
	for (var j = 0; j < links.length; j ++)
	{
		var link = links[j];
		var ni = link.ni;
		if (ni != 0)
			continue;
		if (is_hadamard_edge(nodes[link.source.index].id,nodes[link.target.index].id))
			link.ni = MAGIC_MISSING_HADAMARD_EDGES_NI;
	}
}
