from dataclasses import dataclass, asdict
from datetime import datetime
import json


@dataclass()
class BroadcastDiffusion:
    startDate: datetime
    stopDate: datetime
    callPlanningId: int
    description: str
    scenarioId: int
    broadcastName: str

    def to_json(self):
        return json.dumps(dataclass.asdict(self))


@dataclass()
class CustomizableMessage:
    customizableId: int
    multimediaType: int
    text: str
