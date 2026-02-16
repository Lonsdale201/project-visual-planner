import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import { alpha } from '@mui/material/styles';
import type { EdgeType } from '../../model/types';

interface EdgeTheme {
  border: string;
  header: string;
  text: string;
}

export interface ProjectEdgeData {
  edgeKind?: EdgeType;
  sourceTheme?: EdgeTheme;
  hideLabel?: boolean;
  dimmed?: boolean;
}

type EdgePathResult = [string, number, number, number, number];

function getEdgePathByType(props: EdgeProps, edgeKind: EdgeType): EdgePathResult {
  if (edgeKind === 'straight') {
    return getStraightPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      targetX: props.targetX,
      targetY: props.targetY,
    });
  }

  if (edgeKind === 'smoothstep') {
    return getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      targetX: props.targetX,
      targetY: props.targetY,
      sourcePosition: props.sourcePosition,
      targetPosition: props.targetPosition,
    });
  }

  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });
}

export default function ProjectEdge(props: EdgeProps) {
  const { id, markerStart, markerEnd, label, selected, style, data } = props;
  const edgeData = (data ?? {}) as ProjectEdgeData;
  const edgeKind = edgeData.edgeKind ?? 'smoothstep';
  const sourceTheme = edgeData.sourceTheme;
  const hideLabel = Boolean(edgeData.hideLabel);
  const dimmed = Boolean(edgeData.dimmed);

  const [edgePath, labelX, labelY] = getEdgePathByType(props, edgeKind);

  const stroke = dimmed ? alpha(sourceTheme?.border ?? '#8fa5bc', 0.35) : (sourceTheme?.border ?? '#8fa5bc');
  const strokeWidth = selected ? 2.9 : 2.2;

  const baseStyle = {
    ...style,
    stroke,
    strokeWidth,
  };

  const hasLabel = !hideLabel && typeof label === 'string' && label.trim().length > 0;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={baseStyle}
      />

      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan kf-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1,
              padding: '5px 10px',
              borderRadius: 999,
              border: `1px solid ${alpha(sourceTheme?.border ?? '#7b8794', 0.4)}`,
              background: sourceTheme?.header ?? '#f3f4f6',
              color: sourceTheme?.text ?? '#334155',
              opacity: dimmed ? 0.45 : 1,
              whiteSpace: 'nowrap',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
