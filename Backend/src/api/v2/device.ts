import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { and, eq } from 'drizzle-orm/sql/expressions/conditions'
import { db } from '../..'
import { deviceOwners, devies } from '../../db/schema'

const deviceDataItem = t.Object({
  monitorItem: t.String(),
  monitorTime: t.String(),
  monitorValue: t.String(),
  nodeId: t.Optional(t.String())
})

const deviceResponseItem = t.Object({
  data: t.Array(deviceDataItem),
  dataStatus: t.Number(),
  deviceId: t.String(),
  deviceStatus: t.Number(),
  id: t.Number(),
  customname: t.Optional(t.String()),
  name: t.String(),
  sensorNumber: t.Number()
})

const deviceResponseSchema = t.Object({
  code: t.Number(),
  data: t.Array(deviceResponseItem),
  message: t.String(),
  status: t.String()
})

const deviceLatestResponseSchema = t.Object({
  code: t.Number(),
  monitorValue: t.String(),
  monitorTime: t.String()
})

const deviceRegisterResponseSchema = t.Object({
  code: t.Number(),
  message: t.String()
})

const getBearerToken = (authHeader?: string) => {
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

const buildEmptyResponse = (deviceId: string) => ({
  code: 0,
  data: [
    {
      data: [],
      dataStatus: 0,
      deviceId,
      deviceStatus: 0,
      id: 0,
      customname: '',
      name: '',
      sensorNumber: 0
    }
  ],
  message: 'ok',
  status: 'ok'
})

export const deviceRoutes = new Elysia({
  prefix: '/api/v2/device'
})
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'change-me'
    })
  )
  .post(
    '/register',
    async ({ body, headers, jwt }) => {
      const token = getBearerToken(headers.authorization)

      if (!token) {
        return {
          code: 401,
          message: 'Missing Authorization header'
        }
      }

      const payload = await jwt.verify(token).catch(() => null)

      if (!payload || typeof payload.id !== 'number') {
        return {
          code: 401,
          message: 'Invalid or expired token'
        }
      }

      const database = await db
      const {
        deviceId,
        deviceSecretKey,
        monitorItem,
        customName,
        deviceLocation
      } = body

      const existing = await database
        .select()
        .from(devies)
        .where(eq(devies.secretId, deviceId))
        .limit(1)

      let deviceRecord = existing[0]

      if (deviceRecord) {
        const storedKey = deviceRecord.deviceKey ?? ''
        const validKey = await Bun.password.verify(deviceSecretKey, storedKey)

        if (!validKey) {
          return {
            code: 401,
            message: 'Invalid device secret'
          }
        }
      } else {
        const hashedSecretKey = await Bun.password.hash(deviceSecretKey)

        await database.insert(devies).values({
          secretId: deviceId,
          deviceKey: hashedSecretKey,
          monitorItem,
          customName: customName ?? null,
          deviceName: null,
          latitude: deviceLocation?.latitude ?? null,
          longitude: deviceLocation?.longtitude ?? null
        })

        const created = await database
          .select()
          .from(devies)
          .where(eq(devies.secretId, deviceId))
          .limit(1)

        deviceRecord = created[0]

        if (!deviceRecord) {
          return {
            code: 500,
            message: 'Failed to register device'
          }
        }
      }

      const ownership = await database
        .select()
        .from(deviceOwners)
        .where(
          and(
            eq(deviceOwners.userId, payload.id),
            eq(deviceOwners.deviceId, deviceRecord.id)
          )
        )
        .limit(1)

      if (ownership.length === 0) {
        await database.insert(deviceOwners).values({
          userId: payload.id,
          deviceId: deviceRecord.id
        })
      }

      return {
        code: 200,
        message: 'ok'
      }
    },
    {
      headers: t.Object({
        authorization: t.String()
      }),
      body: t.Object({
        deviceId: t.String(),
        deviceSecretKey: t.String(),
        monitorItem: t.String(),
        customName: t.Optional(t.String()),
        deviceLocation: t.Optional(
          t.Object({
            latitude: t.String(),
            longtitude: t.String()
          })
        )
      }),
      response: deviceRegisterResponseSchema
    }
  )
  .post(
    '/',
    ({ body }) => {
      const { deviceId } = body

      return buildEmptyResponse(deviceId)
    },
    {
      body: t.Object({
        deviceId: t.String(),
        deviceSecretKey: t.String(),
        minitorItem: t.String(),
        start: t.Number(),
        end: t.Number()
      }),
      response: deviceResponseSchema
    }
  )
  .post(
    '/batch',
    ({ body }) => {
      const firstDevice = body.deviceList[0]
      const deviceId = firstDevice ? firstDevice.deviceId : ''

      return buildEmptyResponse(deviceId)
    },
    {
      body: t.Object({
        deviceList: t.Array(
          t.Object({
            deviceId: t.String(),
            deviceSecretKey: t.String()
          })
        ),
        monitorItem: t.Array(t.String()),
        start: t.Number(),
        end: t.Number()
      }),
      response: deviceResponseSchema
    }
  )
  .post(
    '/latest',
    async ({ body }) => {
      const baseUrl = process.env.MAIN_STREAM_URL

      if (!baseUrl) {
        return {
          code: 500,
          monitorValue: '',
          monitorTime: ''
        }
      }

      const response = await fetch(`${baseUrl}/latest`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        return {
          code: response.status,
          monitorValue: '',
          monitorTime: ''
        }
      }

      const payload = await response.json()
      const dataItem = payload?.data?.find(
        (item: { data?: Array<{ monitorValue?: string; monitorTime?: string }> }) =>
          Array.isArray(item.data) && item.data.length > 0
      )?.data?.[0]

      return {
        code: typeof payload?.code === 'number' ? payload.code : response.status,
        monitorValue: dataItem?.monitorValue ?? '',
        monitorTime: dataItem?.monitorTime ?? ''
      }
    },
    {
      body: t.Object({
        deviceId: t.String(),
        deviceSecretKey: t.String(),
        monitorItem: t.String()
      }),
      response: deviceLatestResponseSchema
    }
  )
