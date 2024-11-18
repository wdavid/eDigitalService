const Post = require('../models/post.model');
const controller = {};
const Mongoose = require('mongoose');
const debug = require('debug')('app:post-controller');
const User = require('../models/user.model');

// Crear un nuevo registro de consumo
controller.create = async (req, res, next) => {
    try {
        const { userId, volumen, vasos } = req.body;
        const { user } = req;

        // Validar que los datos necesarios estén presentes
        if (!userId || !volumen || !vasos) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        // Crear el registro
        const post = new Post({
            userId,
            volumen,
            vasos,
        });

        const postSave = await post.save();
        if (!postSave) {
            return res.status(400).json({ error: "Error creating post" });
        }

        return res.status(201).json(postSave);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtener todos los registros de consumo
controller.findAll = async (req, res, next) => {
    try {
        // Buscar registros con información del usuario
        const posts = await Post.find().populate('userId', 'username email');
        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "Posts not found" });
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtener un registro de consumo por ID
controller.findOneById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).populate('userId', 'username email');
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Eliminar un registro de consumo por ID
controller.deleteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


controller.getDailyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Obtener la fecha de inicio y fin del día actual
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId), // Filtrar por usuario
                    createdAt: { $gte: startOfDay, $lte: endOfDay }, // Filtrar por el día de hoy
                },
            },
            {
                $group: {
                    _id: null, // No agrupar por fecha, ya que es solo para hoy
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" },
                },
            },
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Construir la respuesta
        const response = {
            date: startOfDay.toISOString().split("T")[0], // Formato YYYY-MM-DD
            totalVolumen: dailyConsumption[0]?.totalVolumen || 0,
            totalVasos: dailyConsumption[0]?.totalVasos || 0,
            user,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getDailyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

controller.getWeeklyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Calcular los últimos 7 días (incluido hoy)
        const endOfRange = new Date(); // Hoy
        endOfRange.setHours(23, 59, 59, 999);
        const startOfRange = new Date();
        startOfRange.setDate(endOfRange.getDate() - 6); // Hace 6 días (incluido hoy)
        startOfRange.setHours(0, 0, 0, 0);

        const weeklyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId), // Filtrar por usuario
                    createdAt: { $gte: startOfRange, $lte: endOfRange }, // Últimos 7 días
                },
            },
            {
                $group: {
                    _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }, // Agrupar por fecha
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" },
                },
            },
            {
                $sort: { "_id.day": 1 }, // Ordenar por fecha
            },
        ]);

        // Crear un mapeo de los días de la semana
        const daysOfWeek = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

        // Generar los últimos 7 días con sus valores predeterminados
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(endOfRange.getDate() - i);
            const dayOfWeek = daysOfWeek[date.getDay()];
            return {
                date: date.toISOString().split("T")[0], // Formato YYYY-MM-DD
                dayOfWeek,
                totalVolumen: 0,
                totalVasos: 0,
            };
        }).reverse(); // Orden cronológico

        // Rellenar los datos obtenidos en los últimos 7 días
        weeklyConsumption.forEach((entry) => {
            const index = last7Days.findIndex((day) => day.date === entry._id.day);
            if (index !== -1) {
                last7Days[index].totalVolumen = entry.totalVolumen;
                last7Days[index].totalVasos = entry.totalVasos;
            }
        });

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Construir la respuesta
        const response = {
            startOfRange: startOfRange.toISOString().split("T")[0], // Inicio de los últimos 7 días
            endOfRange: endOfRange.toISOString().split("T")[0],     // Fin de los últimos 7 días
            weeklyConsumption: last7Days,
            user,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getWeeklyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


controller.getMonthlyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Calcular los últimos 30 días
        const endOfRange = new Date(); // Hoy
        endOfRange.setHours(23, 59, 59, 999);
        const startOfRange = new Date();
        startOfRange.setDate(endOfRange.getDate() - 29); // Hace 30 días (incluyendo hoy)
        startOfRange.setHours(0, 0, 0, 0);

        const monthlyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId), // Filtrar por usuario
                    createdAt: { $gte: startOfRange, $lte: endOfRange }, // Últimos 30 días
                },
            },
            {
                $group: {
                    _id: { day: { $dayOfMonth: "$createdAt" } }, // Agrupar por día del mes
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" },
                },
            },
            {
                $sort: { "_id.day": 1 }, // Ordenar por día del mes
            },
        ]);

        // Crear los últimos 30 días en formato completo
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(endOfRange.getDate() - i);
            date.setHours(0, 0, 0, 0);
            return {
                date,
                day: date.getDate(),
                totalVolumen: 0,
                totalVasos: 0,
            };
        }).reverse(); // Orden cronológico

        // Rellenar datos de consumo
        monthlyConsumption.forEach((entry) => {
            const index = last30Days.findIndex((day) => day.day === entry._id.day);
            if (index !== -1) {
                last30Days[index].totalVolumen = entry.totalVolumen;
                last30Days[index].totalVasos = entry.totalVasos;
            }
        });

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Construir la respuesta
        const response = {
            startOfRange: startOfRange.toISOString().split("T")[0], // Inicio de los últimos 30 días
            endOfRange: endOfRange.toISOString().split("T")[0],     // Fin de los últimos 30 días
            monthlyConsumption: last30Days,
            user,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getMonthlyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = controller;
