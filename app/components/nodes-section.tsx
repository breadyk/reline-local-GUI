import { Card, CardHeader, CardContent } from "~/components/ui"
import React, { useContext } from "react"
import { NodesContext } from "~/context/contexts"
import { NodeResolver } from "~/components/node-resolver"
import { AddNodeButton } from "~/components/add-node-button"

export function NodesSection() {
  const nodes = useContext(NodesContext)
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center">
        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">Nodes</h2>
        <AddNodeButton />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {nodes.map((data, index) => (
          <NodeResolver key={`${data.type}_${index}`} id={data.id} />
        ))}
      </CardContent>
    </Card>
  )
}
