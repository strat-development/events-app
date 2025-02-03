"use client"

import { Equal, TrendingDown, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import {
    Card,
    CardContent
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
} from "@/components/ui/chart"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { useQuery } from "react-query"
import { useUserContext } from "@/providers/UserContextProvider"
import { useState } from "react"
import { Button } from "@/components/ui/button"


const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

export const StatisticsSection = () => {
    const supabase = createClientComponentClient<Database>()
    const { userId } = useUserContext()
    const [eventIds, setEventIds] = useState<string[]>([])
    const [attendees, setAttendees] = useState<Record<string, number>>({})
    const [comparisonRange, setComparisonRange] = useState(1);

    const fetchEvents = useQuery("events", async () => {
        const { data, error } = await supabase
            .from("events")
            .select("id, event_title, starts_at")
            .eq("created_by", userId)

        if (error) {
            throw new Error(error.message)
        }

        if (data) {
            setEventIds(data.map(event => event.id))
        }

        return data
    }, {
        enabled: !!userId,
        cacheTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
    })

    const fetchAttendees = useQuery(["attendees", eventIds], async () => {
        if (eventIds.length === 0) return [];

        const { data, error } = await supabase
            .from("event-attendees")
            .select("event_id, attendee_id")
            .in("event_id", eventIds);

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }, {
        enabled: eventIds.length > 0,
        cacheTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        onSuccess: (data) => {
            const attendeeCounts = data.reduce((acc, { event_id }) => {
                if (event_id !== null) {
                    acc[event_id] = (acc[event_id] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            setAttendees(attendeeCounts);
        }
    });

    const monthMap: Record<string, { event: string; count: number }[]> = {};

    const today = new Date();
    const lastSixMonths = [...Array(6)].map((_, i) => {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        return d.toLocaleString("en-US", { month: "long" });
    }).reverse();

    lastSixMonths.forEach(month => {
        monthMap[month] = [];
    });

    fetchEvents.data?.forEach(event => {
        const month = event.starts_at ? new Date(event.starts_at).toLocaleString("en-US", { month: "long" }) : "Unknown";
        if (monthMap[month]) {
            monthMap[month].push({
                event: event.event_title || "",
                count: attendees[event.id] || 0
            });
        }
    });

    const chartData = lastSixMonths.map((month, index) => {
        const attendees = monthMap[month].reduce((sum, e) => sum + e.count, 0);
        const prevAttendees = index > 0 ? monthMap[lastSixMonths[index - 1]].reduce((sum, e) => sum + e.count, 0) : null;

        let trend = null;
        if (prevAttendees !== null) {
            trend = prevAttendees === 0 ? 100 : ((attendees - prevAttendees) / prevAttendees) * 100;
        }

        return {
            month,
            attendees,
            events: monthMap[month],
            trend: trend !== null ? parseFloat(trend.toFixed(1)) : null
        };
    });

    const calculateTrend = (range: any) => {
        const currentAttendees = chartData[chartData.length - 1]?.attendees || 0;

        const pastMonths = chartData.slice(-range - 1, -1);
        const pastAverage = pastMonths.length
            ? pastMonths.reduce((sum, month) => sum + month.attendees, 0) / pastMonths.length
            : 0;

        return pastAverage === 0 ? 100 : ((currentAttendees - pastAverage) / pastAverage) * 100;
    };


    return (
        <div className="max-w-[1200px] w-full pl- min-[900px]:pl-16 flex gap-8 max-[768px]:flex-wrap">
            <Card className="min-[768px]:w-3/4 w-full p-4 border-white/10">
                <CardContent>
                    <ChartContainer config={chartConfig}>
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ top: 20 }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;

                                    const data = payload[0].payload;
                                    return (
                                        <div className="p-2 bg-current shadow-md border border-white/10 rounded-md text-sm">
                                            <p className="text-white font-semibold">{data.month}</p>
                                            {data.events.length ? (
                                                <ul className="mt-1">
                                                    {data.events.map((event: { event: string; count: number }, idx: number) => (
                                                        <li className="text-white/70" key={idx}>{event.event} - {event.count}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div>No events</div>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="attendees" fill="var(--color-desktop)" radius={8}>
                                <LabelList
                                    position="top"
                                    offset={12}
                                    className="fill-foreground"
                                    fontSize={12}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="w-full min-[768px]:w-1/4 p-4 rounded-lg shadow-md border-white/10 border h-72 text-primary">
                <div className="flex flex-wrap gap-4">
                    {[1, 3, 6].map((range) => (
                        <Button variant="ghost"
                            key={range}
                            onClick={() => setComparisonRange(range)}
                            className={`px-3 py-1 rounded-lg border border-white/10 ${comparisonRange === range ? "border-blue-500 text-white" : ""
                                }`}
                        >
                            {range}M
                        </Button>
                    ))}
                </div>

                {(() => {
                    const trend = calculateTrend(comparisonRange);
                    let trendColor = "text-gray-500";
                    if (trend > 0) trendColor = "text-green-500";
                    else if (trend < 0) trendColor = "text-red-500";

                    return (
                        <div className="relative flex flex-col justify-center items-center">
                            {trend > 0 ? (
                                <TrendingUp className="opacity-20 blur-[2px]" size={196}
                                    strokeWidth={1} />
                            ) : trend < 0 ? (
                                <TrendingDown className="opacity-20 blur-[2px]" size={196}
                                    strokeWidth={1} />
                            ) : (
                                <Equal className="opacity-20 blur-[2px]" size={196}
                                    strokeWidth={1} />
                            )}

                            <h2 className={`absolute text-6xl min-[900px]:text-5xl min-[1024px]:text-6xl min-[1200px]:text-7xl font-bold ${trendColor}`}>
                                {trend.toFixed(1)}%
                            </h2>

                            <p className="absolute bottom-0 leading-5 text-center tracking-wide text-sm text-white/60">
                                Compared to the last {comparisonRange} month{comparisonRange > 1 ? "s" : ""}, attendee trends are{" "}
                                {trend > 0 ? "growing 🎉" : trend < 0 ? "declining 😔" : "steady. Not bad - not good 😉"}
                            </p>
                        </div>
                    );
                })()}
            </Card>
        </div >
    )
}