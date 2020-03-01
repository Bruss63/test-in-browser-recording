import React from "react";

const SVG = ({
	style = {},
	fill = "#000",
	width = "100%",
	className = "",
	viewBox = "0 0 34 32"
}) => (
	<svg
		width={width}
		style={style}
		height={width}
		viewBox={viewBox}
		xmlns="http://www.w3.org/2000/svg"
		className={`svg-icon ${className || ""}`}
		xmlnsXlink="http://www.w3.org/1999/xlink"
	>
		<path fill={fill} d="M15 22c2.761 0 5-2.239 5-5v-12c0-2.761-2.239-5-5-5s-5 2.239-5 5v12c0 2.761 2.239 5 5 5zM22 14v3c0 3.866-3.134 7-7 7s-7-3.134-7-7v-3h-2v3c0 4.632 3.5 8.447 8 8.944v4.056h-4v2h10v-2h-4v-4.056c4.5-0.497 8-4.312 8-8.944v-3h-2z"></path>
	</svg>
);

export default SVG;
