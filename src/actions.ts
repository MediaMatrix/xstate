import {
  Action,
  Event,
  EventType,
  EventObject,
  ActivityAction,
  SendAction,
  SendActionOptions,
  CancelAction,
  ActionObject,
  ActionType,
  Assigner,
  PropertyAssigner,
  AssignAction,
  ActionFunction,
  ActionFunctionMap
} from './types';
import * as actionTypes from './actionTypes';
import { getEventType } from './utils';

export { actionTypes };

const createActivityAction = <TExtState>(actionType: string) => (
  activity: ActionType | ActionObject<TExtState>
): ActivityAction<TExtState> => {
  const data = toActionObject(activity);
  const { exec } = data;
  return {
    type: actionType,
    activity: getEventType(activity),
    data,
    exec
  };
};

export const toEventObject = (
  event: Event,
  id?: string | number
): EventObject => {
  if (typeof event === 'string' || typeof event === 'number') {
    const eventObject: EventObject = { type: event };
    if (id !== undefined) {
      eventObject.id = id;
    }

    return eventObject;
  }

  return event;
};

function getActionFunction<TExtState>(
  actionType: ActionType,
  actionFunctionMap?: ActionFunctionMap<TExtState>
): ActionFunction<TExtState> | undefined {
  if (!actionFunctionMap) {
    return undefined;
  }
  const actionReference = actionFunctionMap[actionType];

  if (!actionReference) {
    return undefined;
  }

  if (typeof actionReference === 'function') {
    return actionReference;
  }

  return actionReference.exec;
}

export const toActionObject = <TExtState>(
  action: Action<TExtState>,
  actionFunctionMap?: ActionFunctionMap<TExtState>
): ActionObject<TExtState> => {
  let actionObject: ActionObject<TExtState>;

  if (typeof action === 'string' || typeof action === 'number') {
    actionObject = {
      type: action,
      exec: getActionFunction(action, actionFunctionMap)
    };
  } else if (typeof action === 'function') {
    actionObject = {
      type: action.name,
      exec: action
    };
  } else {
    const exec = getActionFunction(action.type, actionFunctionMap);
    return exec
      ? {
          ...action,
          exec
        }
      : action;
  }

  Object.defineProperty(actionObject, 'toString', {
    value: () => actionObject.type
  });

  return actionObject;
};

export const toActionObjects = <TExtState>(
  action: Array<Action<TExtState> | Action<TExtState>> | undefined,
  actionFunctionMap?: ActionFunctionMap<TExtState>
): Array<ActionObject<TExtState>> => {
  if (!action) {
    return [];
  }

  const actions = Array.isArray(action) ? action : [action];

  return actions.map(subAction => toActionObject(subAction, actionFunctionMap));
};

export const raise = (eventType: EventType): EventObject => ({
  type: actionTypes.raise,
  event: eventType
});

export const send = (event: Event, options?: SendActionOptions): SendAction => {
  return {
    type: actionTypes.send,
    event: toEventObject(event),
    delay: options ? options.delay : undefined,
    id: options && options.id !== undefined ? options.id : getEventType(event)
  };
};

export const cancel = (sendId: string | number): CancelAction => {
  return {
    type: actionTypes.cancel,
    sendId
  };
};

export const start = createActivityAction(actionTypes.start);
export const stop = createActivityAction(actionTypes.stop);

export const assign = <TExtState>(
  assignment: Assigner<TExtState> | PropertyAssigner<TExtState>
): AssignAction<TExtState> => {
  return {
    type: actionTypes.assign,
    assignment
  };
};

export function isActionObject<TExtState>(
  action: Action<TExtState>
): action is ActionObject<TExtState> {
  return typeof action === 'object' && 'type' in action;
}
