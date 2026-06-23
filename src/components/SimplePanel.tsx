import React, { useRef, useMemo } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { useDimensions } from 'hooks/useDimensions';
import { contourDensity, scaleLinear, geoPath, interpolateTurbo } from 'd3';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
    iframe: css`
      width: 375px;
      height: 667px;
      border: none;
    `,
    container: css`
      position: relative;
      width: fit-content;
      height: fit-content;
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(getStyles);

  const svgRef = useRef<SVGSVGElement>(null);
  const { dimensions } = useDimensions(svgRef);
  const { width: _width, height: _height } = dimensions;

  // Pick the previewed rapid once per dataset. Computing this in the render body
  // re-rolls Math.random() on every re-render (e.g. the ResizeObserver firing),
  // which makes the iframe reload a different rapid each time.
  const rapidIdValues = data.series[1]?.fields[0]?.values;
  const randomRapidId = useMemo(() => {
    if (!rapidIdValues || rapidIdValues.length === 0) {
      return undefined;
    }
    return rapidIdValues[Math.floor(Math.random() * rapidIdValues.length)];
  }, [rapidIdValues]);

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  /**
   * It is assumed that the query will return two series in this order:
   * 1. Points series with x and y fields
   * 2. Rapids series with rapid ids
   */
  const [pointsSeries, rapidsSeries] = data.series;

  if (rapidsSeries?.fields[0].values.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} suggestions={[]} />;
  }

  /**
   * It is assumed that the query will return x and y in this order
   */
  const [xPoints, yPoints] = pointsSeries.fields;

  const yScale = scaleLinear().domain([0, 100]).range([0, _height]);
  const xScale = scaleLinear().domain([0, 100]).range([0, _width]);

  const p = xPoints.values.map((x, i) => {
    return {
      x: x as number,
      y: yPoints.values[i] as number,
      weight: 1,
    };
  });

  const contourGenerator = contourDensity<{
    x: number;
    y: number;
    weight?: number;
  }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .size([_width, _height])
    .bandwidth(10);

  if (p.some((point) => point.weight !== undefined)) {
    contourGenerator.weight((d) => {
      return d.weight ?? 1;
    });
  }

  const contourData = contourGenerator(p);

  const maxContourValue = contourData.length ? Math.max(...contourData.map((contour) => contour.value)) : 1;

  const colorScale = scaleLinear().domain([0, maxContourValue]).range([0, 1]);
  const opacityScale = scaleLinear().domain([0, maxContourValue]).range([0, 0.3]);

  const contours = contourData.map((contour, i) => (
    <path
      key={i}
      d={geoPath()(contour) || ''}
      opacity={1}
      fill={interpolateTurbo(colorScale(contour.value))}
      fillOpacity={opacityScale(contour.value)}
    />
  ));

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <div className={styles.container}>
        <svg ref={svgRef} className={styles.svg} preserveAspectRatio="xMidYMid meet">
          <g>{contours}</g>
        </svg>

        <iframe
          className={styles.iframe}
          src={`https://rapids.rapidata.ai/preview/rapid?id=${randomRapidId}`}
          onLoad={(e) => {
            if ('contentWindow' in e.target) {
              (e.target.contentWindow as Window).postMessage(
                {
                  viewable: true,
                  timestamp: Date.now(),
                },
                'https://rapids.rapidata.ai'
              );
            } else {
              console.warn('No contentWindow in iframe');
            }
          }}
        />
      </div>
    </div>
  );
};
