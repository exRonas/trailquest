import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/respond';
import * as routeService from '../services/route.service';
import { CountriesQuery, RouteListQuery } from '../schemas/route.schema';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const routes = await routeService.listRoutes(
    req.query as unknown as RouteListQuery,
  );
  sendData(res, routes);
});

export const listCountries = asyncHandler(
  async (req: Request, res: Response) => {
    const { lang } = req.query as unknown as CountriesQuery;
    const countries = await routeService.listCountries(lang);
    sendData(res, countries);
  },
);

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.getRouteById(req.params.id);
  sendData(res, route);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.createRoute(req.body);
  sendData(res, route, 201);
});

export const replace = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.replaceRoute(req.params.id, req.body);
  sendData(res, route);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.updateRoute(req.params.id, req.body);
  sendData(res, route);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await routeService.deleteRoute(req.params.id);
  res.status(204).send();
});
