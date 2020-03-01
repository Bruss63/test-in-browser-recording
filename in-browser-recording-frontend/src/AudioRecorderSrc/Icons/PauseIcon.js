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
		<path fill={fill} d="M4 4h10v24h-10zM18 4h10v24h-10z"></path>
	</svg>
);

export default SVG;
