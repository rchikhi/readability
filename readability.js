// readability-related functions
function min_overlap(s,t)
{
	for (var i = 1; i <= s.length; i++)
	{
		if (s.substring(s.length-i,s.length) == t.substring(0, i))
			return i;
	}
	return 0;
}

function nis_from_labelling(links, nodes, labelling, test_existing)
{
	var fresh_links = (links[0].source.id == undefined); // see if links have been altered by d3.force or not yet
	var max_ni = 0;
	for (var i=0; i<links.length; i++) {
		var link = links[i];
		var link_source_index, link_target_index;
		if (fresh_links == true)
		{
			link_source_index = link.source;
			link_target_index = link.target;
		}
		else
		{
			link_source_index = link.source.index;
			link_target_index = link.target.index;
		}
		var ids = [ nodes[link_source_index].id, nodes[link_target_index].id].sort();
		var s = labelling[ids[0]];
		var t = labelling[ids[1]];
		var ni =  min_overlap(s,t);
		max_ni = Math.max(ni, max_ni);
		if (test_existing == false)
		{
			// assign ni's
			links[i].ni = ni;
		}
		else
		{
			// test if assigned ni's are correct
			if (links[i].ni != ni && !(links[i].ni == MAGIC_MISSING_HADAMARD_EDGES_NI && ni == 0))
			{
				console.log("BAD LABELLING! faulty link",links[i],"should be at ni",ni,"debug",s,t,min_overlap(s,t));
				return 0;
			}
		}
	}
	return max_ni;
}
// end of readability related functions

// graph related functions
function neighbors(i, node, nodes, links)
{
	var res = []
	for (var j=0; j < links.length; j++) {
		var link = links[j];
		if (link.ni != i)
			continue;
		if (node == link.source)
			res.push(link.target);
		if (node == link.target)
			res.push(link.source);
	}
	return res;
}

function walk_biclique(node, i, nodes, links, is_left)
{
	if(is_left === undefined) is_left = true;
	var res = [];
	var nbs = neighbors(i, node, nodes, links);
	if (nbs.length > 0)
	{
		if (is_left)
			res = nbs.concat(walk_biclique(nbs[0], i, nodes, links, false));
		else
			res = nbs;
	}
	return res;
}

function number_bicliques(i, nodes, links)
{
	var bicliques_numbering = [];
	var current_number = 0;
	for (var j=0; j<nodes.length; j++) {
		var node = j;
		if (bicliques_numbering[node] === undefined)
		{
			bicliques_numbering[node] = current_number;
			biclique = walk_biclique(node, i, nodes, links);
			for (var k = 0; k < biclique.length; k++)
			{
				var nd = biclique[k];
				bicliques_numbering[nd] = current_number;
			}
			current_number += 1;
		}
	}
	return bicliques_numbering;
}

function nodes_in_biclique_order(i, nodes, links)
{
	var bicliques_numbering = number_bicliques(i, nodes, links);
	var l_counter = [], r_counter = [], n_counter = [];
	for (var j=0; j<nodes.length; j++) {
		var node = j;
		var b_n = bicliques_numbering[j];
		if (l_counter[b_n] == undefined)
			l_counter[b_n] = 0;
		if (r_counter[b_n] == undefined)
			r_counter[b_n] = 0;
		if (nodes[j].id[0] == "l")
		{
			n_counter[j] = l_counter[b_n];
			l_counter[b_n] += 1;
		}
		if (nodes[j].id[0] == "r")
		{
			n_counter[j] = r_counter[b_n];
			r_counter[b_n] += 1;
		}
	}
	for (var j=0; j<nodes.length; j++) {
		var y = 0;
		var b_n = bicliques_numbering[j];
		for (var k=0; k<b_n; k++)
		{
			if (nodes[j].id[0] == "l")
				y += l_counter[k];
			if (nodes[j].id[0] == "r")
				y += r_counter[k];
		}
		nodes[j].biclique_order = y + n_counter[j];
	}
}