import json
import decimal
from uuid import UUID

from django.db import models


class BalanceJSONField(models.TextField):

    def get_db_prep_value(self, value, connection, prepared=False):
        if value is not None:
            value = json.dumps(self.to_json(value))
        return super().get_db_prep_value(value, connection, prepared)

    def from_db_value(self, value, expression, connection):
        if isinstance(value, str):
            value = json.loads(value)
        return value

    def to_json(self, data):
        if isinstance(data, list):
            data = [self.to_json(el) for el in data]
        elif isinstance(data, dict):
            for key, val in data.items():
                data[key] = self.to_json(val)
        elif isinstance(data, decimal.Decimal):
            data = float(data)
        elif data is None:
            data = 0
        elif isinstance(data, UUID):
            data = str(data)
        return data
