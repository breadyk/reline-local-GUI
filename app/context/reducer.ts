import { STORAGE_KEY } from "~/constants"
import { type NodesAction, NodesActionType } from "~/types/actions"
import type { StackNode } from "~/types/node"

const saveData = (nodes: StackNode[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
}

export const nodesReducer = (state: StackNode[], action: NodesAction): StackNode[] => {
  const newState = processAction(state, action)
  saveData(newState)
  return newState
}

const processAction = (state: StackNode[], action: NodesAction): StackNode[] => {
  const { type, payload } = action
  switch (type) {
    case NodesActionType.CHANGE:
      return state.map((node) => (node.id === payload.id ? payload : node))
    case NodesActionType.ADD:
      return [...state, payload]
    case NodesActionType.DELETE:
      return state.filter((node) => node.id !== payload).map((node, index) => ({ ...node, id: index }))
    case NodesActionType.MOVE: {
      const newArray = []
      for (let i = 0; i < state.length; i += 1) {
        if (i === payload.from) {
          newArray.push({ ...state[payload.to], id: i })
          continue
        }
        if (i === payload.to) {
          newArray.push({ ...state[payload.from], id: i })
          continue
        }
        newArray.push(state[i])
      }
      return newArray
    }
    case NodesActionType.IMPORT:
      return payload
    default:
      return state
  }
}
