// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Artem Barkov

/*
 * Pure logic for the Server widget. stats.json (written by server/b3rry-stats)
 * goes through parse() once; tiles() and serviceRows() turn it into what the
 * widget shows, so the DOM code in app.js only draws.
 */
const Monitor = (() => {
	// [warn from, bad from] - the only place thresholds live
	const THRESHOLDS = {
		cpu: [70, 90],                  // percent busy
		memory: [80, 90],               // percent used
		temperature: [70, 80],          // °C; the Pi 5 throttles from 80
		disk: [80, 90],                 // percent used
		response: [1000, Infinity]      // ms; slow is a warning, down is bad
	};
	const THROTTLE_C = 80;

	/* parse: trust nothing from the network */

	const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
	const isCount = (value) => isNumber(value) && value >= 0;
	const isString = (value) => typeof value === "string";
	const numberOrNull = (value) => (isNumber(value) ? value : null);

	const parseLoad = (load) =>
		Array.isArray(load) && load.length === 3 && load.every(isNumber) ? load : null;

	const parseMemory = (memory) =>
		memory && isCount(memory.total) && memory.total > 0 && isCount(memory.available) && memory.available <= memory.total
			? { total: memory.total, available: memory.available }
			: null;

	const parseDisk = (disk) =>
		disk && isString(disk.mount) && isCount(disk.size) && disk.size > 0 && isCount(disk.used)
			? { mount: disk.mount, size: disk.size, used: disk.used }
			: null;

	const parseSync = (sync) =>
		sync && isString(sync.action) && isNumber(sync.percent) ? { action: sync.action, percent: sync.percent } : null;

	const parseRaid = (array) =>
		array && isString(array.device) && isString(array.level) && typeof array.active === "boolean"
			&& isString(array.members) && typeof array.healthy === "boolean"
			? { device: array.device, level: array.level, active: array.active, members: array.members,
				healthy: array.healthy, sync: parseSync(array.sync) }
			: null;

	const parseService = (service) =>
		service && isString(service.name) && isString(service.url) && typeof service.up === "boolean"
			? { name: service.name, url: service.url, up: service.up,
				code: numberOrNull(service.code), ms: numberOrNull(service.ms) }
			: null;

	const list = (value, parseItem) => (Array.isArray(value) ? value.map(parseItem).filter(Boolean) : []);

	const parse = (data) => {
		if (!data || typeof data !== "object" || Array.isArray(data)) return null;
		if (data.version !== 1 || !isNumber(data.time)) return null;

		return {
			version: 1,
			time: data.time,
			interval: isCount(data.interval) && data.interval > 0 ? data.interval : 10,
			uptime: numberOrNull(data.uptime),
			cpu: numberOrNull(data.cpu),
			load: parseLoad(data.load),
			memory: parseMemory(data.memory),
			temperature: numberOrNull(data.temperature),
			disks: list(data.disks, parseDisk),
			raid: list(data.raid, parseRaid),
			services: list(data.services, parseService)
		};
	};

	/* formatting */

	const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];

	const formatBytes = (bytes) => {
		let value = bytes;
		let unit = 0;
		while (value >= 1024 && unit < UNITS.length - 1) {
			value /= 1024;
			unit += 1;
		}
		const digits = unit > 0 && value < 10 ? 1 : 0;
		return `${value.toFixed(digits)} ${UNITS[unit]}`;
	};

	const formatUptime = (seconds) => {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return minutes > 0 ? `${minutes}m` : "<1m";
	};

	const level = (kind, value) => {
		if (!isNumber(value)) return "unknown";
		const [warn, bad] = THRESHOLDS[kind];
		if (value >= bad) return "bad";
		return value >= warn ? "warn" : "ok";
	};

	/* view model */

	const UNKNOWN = { value: "-", detail: "", level: "unknown" };

	const cpuTile = ({ cpu, load }) => (cpu === null
		? { label: "CPU", ...UNKNOWN, percent: null }
		: {
			label: "CPU",
			value: `${Math.round(cpu)}%`,
			detail: load ? `load ${load.map((n) => n.toFixed(2)).join(" ")}` : "",
			level: level("cpu", cpu),
			percent: cpu
		});

	const memoryTile = ({ memory }) => {
		if (memory === null) return { label: "Memory", ...UNKNOWN, percent: null };
		const used = memory.total - memory.available;
		const percent = (100 * used) / memory.total;
		return {
			label: "Memory",
			value: `${formatBytes(used)} / ${formatBytes(memory.total)}`,
			detail: `${formatBytes(memory.available)} available`,
			level: level("memory", percent),
			percent
		};
	};

	const temperatureTile = ({ temperature }) => (temperature === null
		? { label: "Temperature", ...UNKNOWN }
		: {
			label: "Temperature",
			value: `${temperature.toFixed(1)} °C`,
			detail: `throttles at ${THROTTLE_C} °C`,
			level: level("temperature", temperature)
		});

	const uptimeTile = ({ uptime }) => (uptime === null
		? { label: "Uptime", ...UNKNOWN }
		: { label: "Uptime", value: formatUptime(uptime), detail: "", level: "ok" });

	const raidTile = (array) => {
		const label = array.level ? `${array.device} (${array.level})` : array.device;
		const detail = array.members ? `[${array.members}]` : "";
		const progress = array.sync ? `${array.sync.action} ${Math.round(array.sync.percent)}%` : "";

		if (!array.active) return { label, value: "inactive", detail, level: "bad" };
		if (!array.healthy) {
			return { label, value: progress ? `degraded, ${progress}` : "degraded", detail, level: "bad" };
		}
		if (progress) return { label, value: progress, detail, level: "warn" };
		return { label, value: "healthy", detail, level: "ok" };
	};

	const diskTile = (disk) => {
		const percent = (100 * disk.used) / disk.size;
		return {
			label: `Disk ${disk.mount}`,
			value: `${formatBytes(disk.used)} / ${formatBytes(disk.size)}`,
			detail: `${formatBytes(Math.max(disk.size - disk.used, 0))} free`,
			level: level("disk", percent),
			percent
		};
	};

	const tiles = (stats) => [
		cpuTile(stats),
		memoryTile(stats),
		temperatureTile(stats),
		uptimeTile(stats),
		...stats.raid.map(raidTile),
		...stats.disks.map(diskTile)
	];

	const serviceRow = (service) => {
		if (service.up) {
			const ms = service.ms === null ? null : Math.round(service.ms);
			return { name: service.name, value: ms === null ? "up" : `${ms} ms`, level: ms === null ? "ok" : level("response", ms) };
		}
		const value = service.code !== null && service.code > 0 ? `HTTP ${service.code}` : "down";
		return { name: service.name, value, level: "bad" };
	};

	const serviceRows = (stats) => stats.services.map(serviceRow);

	// The collector died or the network is gone: three missed writes, at least 30 s
	const isStale = (stats, nowSeconds) => nowSeconds - stats.time > Math.max(3 * stats.interval, 30);

	return { THRESHOLDS, parse, formatBytes, formatUptime, level, tiles, serviceRows, isStale };
})();

if (typeof module !== "undefined" && module.exports) {
	module.exports = Monitor;
}
